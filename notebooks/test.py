from math import ceil

import cv2
import keras
import numpy as np

import sudoku

digit_model = keras.models.load_model("models/digits_9957_0146_1717662260.keras")
orientation_model = keras.models.load_model(
    "models/orientations_8953_2279_1717662653.keras"
)


def convert_to_binary(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]


def get_quads(cnts, arc_length_threshold=0.1):
    approxed = [
        cv2.approxPolyDP(
            cnt,
            arc_length_threshold * cv2.arcLength(cnt, True),
            True,
        )
        for cnt in cnts
    ]
    return [c for c in approxed if len(c) == 4]


def distance_from_center(img, cnt):
    M = cv2.moments(cnt)
    if M["m00"] == 0:
        return (float("inf"), float("inf"))

    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    height, width = img.shape
    return (
        abs(cx - (width / 2)),
        abs(cy - (height / 2)),
    )


def near_center(img, cnts, max_distance=0.25):
    for cnt in cnts:
        dx, dy = distance_from_center(img, cnt)
        height, width = img.shape
        if dx / width > max_distance or dy / height > max_distance:
            continue
        yield cnt


def sort_points(p):
    points = [point[0] for point in p]
    points = sorted(points, key=lambda p: p[1])

    top_points = points[:2]
    bottom_points = points[2:]

    top_points = sorted(top_points, key=lambda p: p[0])
    top_left = top_points[0]
    top_right = top_points[1]

    bottom_points = sorted(bottom_points, key=lambda p: p[0])
    bottom_left = bottom_points[0]
    bottom_right = bottom_points[1]

    return [top_left, top_right, bottom_left, bottom_right]


def get_sudoku_corners(img):
    cnts = cv2.findContours(img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)[0]
    central_quads = get_quads(near_center(img, cnts))
    largest_central = max(central_quads, key=lambda c: abs(cv2.contourArea(c)))
    if cv2.contourArea(largest_central) < 1000:
        return None
    return np.float32(sort_points(largest_central))


def get_image_region(img, sorted_points, size=252):
    target = np.float32(
        [
            [0, 0],
            [size, 0],
            [0, size],
            [size, size],
        ]
    )
    transform = cv2.getPerspectiveTransform(sorted_points, target)
    return cv2.warpPerspective(img, transform, (size, size))


def clean_grid(img):
    height, width = img.shape
    lines = cv2.HoughLinesP(img, 1, np.pi / 2, 50, minLineLength=60, maxLineGap=5)
    if lines is None:
        return img

    mask = np.zeros((height, width), dtype=np.uint8)
    for line in lines:
        x1, y1, x2, y2 = line[0]
        cv2.line(mask, (x1, y1), (x2, y2), (255, 0, 0), 2)
    removed = cv2.bitwise_and(img, np.invert(mask))
    return removed


def get_cells(img):
    height, width = img.shape
    return np.array([np.hsplit(c, 9) for c in np.vsplit(img, 9)]).reshape(
        -1, height // 9, width // 9
    )


def predict_orientation(cells, min_conf=0.6):
    orientation_result = orientation_model.predict(
        np.array(cells).reshape(-1, 28, 28, 1),
        verbose=0,
    )
    result = np.apply_along_axis(
        lambda v: np.argmax(v) if np.amax(v) >= min_conf else -1, 1, orientation_result
    )
    values, counts = np.unique([r for r in result if r > -1], return_counts=True)
    if len(counts) == 0:
        return 0
    return values[np.argmax(counts)]


def predict_digits(cells, min_conf=0.99):
    digit_result = digit_model.predict(
        np.array(cells).reshape(-1, 28, 28, 1), verbose=0
    )
    result = np.apply_along_axis(
        lambda v: np.argmax(v) if np.amax(v) >= min_conf else 0, 1, digit_result
    )
    return result


def get_solution_mask(solution, size=700, inset=26):
    cell_size = size / 9
    if solution is None:
        return np.full((size, size, 4), [0, 0, 255, 127], dtype=np.uint8)
    mask = np.zeros((size, size, 4), dtype=np.uint8)
    for y, row in enumerate(solution):
        for x, val in enumerate(row):
            point = (
                int(x * cell_size + inset),
                int(y * cell_size + cell_size - inset),
            )
            if val["locked"]:
                continue
            cv2.putText(
                mask,
                str(val["value"]),
                point,
                cv2.FONT_HERSHEY_SIMPLEX,
                1.25,
                (0, 255, 0, 255) if not val["locked"] else (0, 0, 255, 255),
                2,
                cv2.LINE_AA,
            )
    return mask


def undo_transform(img, rotation, sorted_points, initial_image):
    img_height, img_width, _ = img.shape
    initial_height, initial_width, _ = initial_image.shape
    if rotation is not None:
        img = cv2.rotate(
            img,
            {
                cv2.ROTATE_90_CLOCKWISE: cv2.ROTATE_90_COUNTERCLOCKWISE,
                cv2.ROTATE_180: cv2.ROTATE_180,
                cv2.ROTATE_90_COUNTERCLOCKWISE: cv2.ROTATE_90_CLOCKWISE,
            }[rotation],
        )

    transform = cv2.getPerspectiveTransform(
        np.float32(
            [
                [0, 0],
                [img_width, 0],
                [0, img_height],
                [img_width, img_height],
            ]
        ),
        sorted_points,
    )
    return cv2.warpPerspective(img, transform, (initial_width, initial_height))


def overlay(image, digits):
    image_alpha = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
    return cv2.addWeighted(digits, 1, image_alpha, 1, 0)


def overlay_solution(img, last_solution=None):
    binary = convert_to_binary(img)
    cv2.imshow("binary", binary)
    corners = get_sudoku_corners(binary)
    if corners is None:
        return img, None
    sudoku_grid_img = get_image_region(binary, corners)
    cleaned = clean_grid(sudoku_grid_img)
    cv2.imshow("cleaned", cleaned)

    cells = get_cells(cleaned)
    orientation = predict_orientation(cells)
    fix_rotation = [
        None,
        cv2.ROTATE_90_CLOCKWISE,
        cv2.ROTATE_180,
        cv2.ROTATE_90_COUNTERCLOCKWISE,
    ][orientation]
    if fix_rotation is not None:
        cells = get_cells(cv2.rotate(cleaned, fix_rotation))
    digits = predict_digits(cells).reshape(9, 9)

    for r, row in enumerate(digits):
        for c, v in enumerate(row):
            print(f"{v} " if v is not None else "  ", end="")
            if (c + 1) % 3 == 0:
                print("| ", end="")
        print("")
        if (r + 1) % 3 == 0:
            print(f"{'-'*6}|-" * 3)

    solution = last_solution
    try:
        solution = sudoku.solve(digits)
        print(solution)
    except ValueError as e:
        pass

    mask = get_solution_mask(solution)
    if solution is not None:
        cv2.imshow("solution", cv2.resize(mask, (300, 300)))
    positioned_mask = undo_transform(mask, fix_rotation, corners, img)
    return overlay(img, positioned_mask), solution


if __name__ == "__main__":
    vid = cv2.VideoCapture(0)
    solution = None
    while True:
        ret, frame = vid.read()

        result, solution = overlay_solution(frame, solution)
        cv2.imshow("frame", result)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    vid.release()
    cv2.destroyAllWindows()
