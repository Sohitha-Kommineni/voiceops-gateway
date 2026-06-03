from dataclasses import dataclass
from time import perf_counter


@dataclass
class Stopwatch:
    start: float

    @classmethod
    def start_new(cls) -> "Stopwatch":
        return cls(perf_counter())

    def elapsed_ms(self) -> int:
        return int((perf_counter() - self.start) * 1000)
