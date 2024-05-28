import cv2
import numpy as np

SOLIDITY_THRESHOLD = 0.9
AREA_THRESHOLD = 10000
CHILDREN_THRESHOLD = 7


def count_immediate_children(hierarchy, parent_idx):
    count = 0
    child_idx = hierarchy[0][parent_idx][2]
    while child_idx != -1:
        count += 1
        child_idx = hierarchy[0][child_idx][0]
    return count


def has_parent(hierarchy, idx):
    return hierarchy[0][idx][3] != -1


def find_sudoku_grid(contours, hierarchy):
    largest = None
    largest_area = 0
    for i, cnt in enumerate(contours):
        area = cv2.contourArea(cnt)
        hull = cv2.convexHull(cnt)
        hull_area = cv2.contourArea(hull)
        if hull_area == 0:
            continue

        # Boxes are pretty solid... and we don't care about the tiny ones
        solidity = float(area) / hull_area
        if solidity > SOLIDITY_THRESHOLD and area > AREA_THRESHOLD:
            children = count_immediate_children(hierarchy, i)

            # At this point, a box with enough children and no parents of it's
            # own could be interesting...
            if children > CHILDREN_THRESHOLD and not has_parent(hierarchy, i):
                if area > largest_area:
                    largest = cnt
    return largest


vid = cv2.VideoCapture(0)
while True:
    ret, frame = vid.read()

    grey = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    ret, thresh = cv2.threshold(grey, 127, 255, cv2.THRESH_BINARY)
    inverted_thresh = np.invert(thresh)
    contours, hierarchy = cv2.findContours(
        inverted_thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
    )

    sudoku_grid = find_sudoku_grid(contours, hierarchy)
    if sudoku_grid is not None:
        rect = cv2.minAreaRect(sudoku_grid)
        box = cv2.boxPoints(rect)
        pbox = np.float32([box[0], box[1], box[3], box[2]])
        # cv2.drawContours(frame, [box], 0, (0, 0, 255), 2)

        M = cv2.getPerspectiveTransform(
            pbox, np.float32([[0, 0], [500, 0], [0, 500], [500, 500]])
        )
        focused_grid = cv2.warpPerspective(
            frame,
            M,
            (500, 500),
        )

        cv2.imshow("focused", focused_grid)

    cv2.imshow("frame", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

vid.release()
cv2.destroyAllWindows()
