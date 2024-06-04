def _solve_impl(grid, rows, cols, blocks, idx=0):
    x = idx % 9
    y = idx // 9
    if y == 9:
        return True

    if grid[y][x]["locked"]:
        return _solve_impl(grid, rows, cols, blocks, idx+1)

    row = rows[y]
    col = cols[x]
    block = blocks[y//3][x//3]

    for value in range(1, 10):
        if value in row or value in col or value in block:
            continue

        grid[y][x]["value"] = value
        row.add(value)
        col.add(value)
        block.add(value)
        
        if _solve_impl(grid, rows, cols, blocks, idx+1):
            return True
            
        row.remove(value)
        col.remove(value)
        block.remove(value)
    grid[y][x]["value"] = None
    return False


def solve(grid):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    blocks = [
        [set() for _ in range(3)]
        for _ in range(3)
    ]
    prepared_grid = [[] for _ in range(9)]
    for y, row in enumerate(grid):
        for x, val in enumerate(row):
            prepared_grid[y].append({
                "locked": val is not None,
                "value": val
            })
            if val is not None:
                if val in rows[y] or val in cols[x] or val in blocks[y//3][x//3]:
                    raise ValueError("Grid is invalid")
                rows[y].add(val)
                cols[x].add(val)
                blocks[y//3][x//3].add(val)
    result = _solve_impl(prepared_grid, rows, cols, blocks)
    if not result:
        raise ValueError("Cannot solve this grid")
    return prepared_grid