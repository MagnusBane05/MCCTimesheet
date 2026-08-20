# Pinned to match the production Python version on BlackSun/cPanel (3.11.15
# has no official Windows installer, so local dev also runs through this
# image). This matches the interpreter version only — CloudLinux/Passenger
# is otherwise a materially different environment.
FROM python:3.11.15-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
