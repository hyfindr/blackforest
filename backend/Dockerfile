FROM python:3.12-slim

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY . /app/

RUN pip install --default-timeout=100 --retries=5 --no-cache>
EXPOSE 5000

CMD ["python", "api.py"]