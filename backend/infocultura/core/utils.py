def get_client_ip(request) -> str:
    """
    Extracts the client's IP address from the request object,
    handling proxy headers if present.
    """
    forwarded_for = (request.META.get('HTTP_X_FORWARDED_FOR') or '').strip()
    if forwarded_for:
        return forwarded_for.split(',')[0].strip() or 'unknown'

    return (request.META.get('REMOTE_ADDR') or '').strip() or 'unknown'
