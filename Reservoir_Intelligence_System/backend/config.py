import os
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class ReservoirConfig:
    name: Optional[str]
    description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    max_water_level_m: float
    full_storage_capacity_mcm: float
    safety_threshold_m: float
    minimum_operating_level_m: float
    spillway_gates_count: int
    hydroelectric_capacity_mw: float


def _float_env(name: str, default: float) -> float:
    value = os.getenv(name)
    return default if value is None else float(value)


def _int_env(name: str, default: int) -> int:
    value = os.getenv(name)
    return default if value is None else int(value)


def _optional_float_env(name: str) -> Optional[float]:
    value = os.getenv(name)
    return None if value is None else float(value)


def load_reservoir_config() -> ReservoirConfig:
    max_level = _float_env("RIS_MAX_WATER_LEVEL_M", 50.0)
    safety_threshold = _float_env("RIS_SAFETY_THRESHOLD_M", max_level * 0.9)

    return ReservoirConfig(
        name=os.getenv("RIS_RESERVOIR_NAME") or None,
        description=os.getenv("RIS_RESERVOIR_DESCRIPTION") or None,
        latitude=_optional_float_env("RIS_RESERVOIR_LATITUDE"),
        longitude=_optional_float_env("RIS_RESERVOIR_LONGITUDE"),
        max_water_level_m=max_level,
        full_storage_capacity_mcm=_float_env(
            "RIS_FULL_STORAGE_CAPACITY_MCM", 1200.0
        ),
        safety_threshold_m=safety_threshold,
        minimum_operating_level_m=_float_env(
            "RIS_MINIMUM_OPERATING_LEVEL_M", 15.0
        ),
        spillway_gates_count=_int_env("RIS_SPILLWAY_GATES_COUNT", 12),
        hydroelectric_capacity_mw=_float_env(
            "RIS_HYDROELECTRIC_CAPACITY_MW", 240.0
        ),
    )


RESERVOIR_CONFIG = load_reservoir_config()
