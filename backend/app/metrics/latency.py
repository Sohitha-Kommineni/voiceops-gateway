from time import perf_counter


class LatencyTracker:
    def __init__(self) -> None:
        self.marks: dict[str, float] = {}

    def mark(self, name: str) -> None:
        self.marks[name] = perf_counter()

    def since(self, name: str) -> int:
        return int((perf_counter() - self.marks[name]) * 1000)

    def between(self, start: str, end: str) -> int:
        return int((self.marks[end] - self.marks[start]) * 1000)
