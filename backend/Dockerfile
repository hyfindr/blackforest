FROM python:3.12-slim

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY . /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY ../.env /app/.env

EXPOSE 5000

CMD ["python", "app.py"]