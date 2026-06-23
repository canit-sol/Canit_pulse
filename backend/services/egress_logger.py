import time
import json
import logging

logger = logging.getLogger("egress")
logger.setLevel(logging.INFO)

# Optional: Add console handler if not already configured
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('[EGRESS] %(asctime)s - %(message)s'))
    logger.addHandler(ch)

def log_egress(endpoint_name: str, start_time: float, num_records: int, payload_data: dict | list):
    """
    Logs the query execution time, number of records returned, and the estimated JSON payload size.
    """
    execution_time_ms = (time.time() - start_time) * 1000
    try:
        # Skip stringifying large reports payloads to prevent OOM on 512MB RAM
        if "reports" in endpoint_name.lower():
            size_str = "Skipped (Large reports payload)"
        else:
            # Estimate size by dumping to JSON and getting length
            payload_json = json.dumps(payload_data, default=str)
            size_bytes = len(payload_json)
            
            # Convert to KB or MB for readability
            if size_bytes > 1024 * 1024:
                size_str = f"{size_bytes / (1024 * 1024):.2f} MB"
            elif size_bytes > 1024:
                size_str = f"{size_bytes / 1024:.2f} KB"
            else:
                size_str = f"{size_bytes} Bytes"
            
        logger.info(
            f"Endpoint: {endpoint_name} | "
            f"Time: {execution_time_ms:.1f}ms | "
            f"Records: {num_records} | "
            f"Est. Size: {size_str}"
        )
    except Exception as e:
        logger.warning(f"Endpoint: {endpoint_name} | Failed to estimate egress size: {e}")
