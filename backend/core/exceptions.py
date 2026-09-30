"""
Shared DRF exception handling so every API error response has the same
predictable shape: {"detail": <human message>, "errors": <field errors | null>}.
Frontend error UI (ApiTimesheetService) relies on this shape rather than
guessing at DRF's default (which varies by exception type).
"""
from rest_framework.views import exception_handler as drf_exception_handler


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        # Let Django's default 500 handling take over — never leak tracebacks.
        return None

    data = response.data
    if isinstance(data, dict) and 'detail' in data and len(data) == 1:
        detail = str(data['detail'])
        errors = None
    else:
        errors = data
        # Extract first validation error message for the detail field
        detail = 'The request could not be completed.'
        if isinstance(errors, dict):
            for _, field_errors in errors.items():
                if isinstance(field_errors, list) and field_errors:
                    detail = str(field_errors[0])
                    break

    response.data = {'detail': detail, 'errors': errors}
    return response
