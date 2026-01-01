import phonenumbers
from phonenumbers import geocoder, timezone, carrier

def start_phone_tracer(target):
    print(f"[+] PhoneTracer v2.1 - OSINT")
    print(f"[*] Target: {target}")
    print(f"[*] Initiating trace... ")

    try:
        p = phonenumbers.parse(target, None)

        # Location
        location = geocoder.description_for_number(p, "en")
        print(f"[+] Location: {location}")

        # Timezone
        tz = timezone.time_zones_for_number(p)
        print(f"[+] Timezone: {', '.join(tz) if tz else 'Unknown'}")

        # Carrier/Network
   
        network = carrier.name_for_number(p, "en")
        print(f"[+] Carrier: {network if network else 'Unknown'}")

        # Additional info
        print(f"[+] Country Code: +{p.country_code}")
        print(f"[+] National Number: {p.national_number}")
        print(f"[+] Valid Number: {phonenumbers.is_valid_number(p)}")
        print(f"[+] Number Type: {get_number_type(p)}")

    except phonenumbers.NumberParseException as e:
        print(f"[-] Error: {e}")

    print(f"[+] Trace complete")

def get_number_type(p):
    types = {
        0: "Fixed Line",
        1: "Mobile",
        2: "Fixed Line or Mobile",
        3: "Toll Free",
        4: "Premium Rate",
        5: "Shared Cost",
        6: "VoIP",
        7: "Personal Number",
        8: "Pager",
        9: "UAN",
        10: "Unknown"
    }
    return types.get(phonenumbers.number_type(p), "Unknown")

if __name__ == "__main__":
    phone = input("Enter phone number (with country code, e.g. +1234567890): ")
    start_phone_tracer(phone)