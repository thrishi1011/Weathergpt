from .imd_client import IMDClient


client = IMDClient()

try:
    response = client.get_current_weather("43087")
    print(response)
finally:
    client.close()