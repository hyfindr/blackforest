import os
import pika
import json
from pdf_parser import process_pdf  # Assuming this is the function to process the PDF

def callback(ch, method, properties, body):
    message = json.loads(body)
    print(f"Received message: {message}")

    file_path = message['file_path']
    filename = message['filename']
    category = message['category']

    process_pdf(file_path, category)
    print(f"Processing PDF {filename} (Category: {category})")

    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_messages():
    connection = pika.BlockingConnection(pika.ConnectionParameters(os.getenv('RABBITMQ_HOST', 'localhost')))
    channel = connection.channel()
    channel.queue_declare(queue='pdf_processing')
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='pdf_processing', on_message_callback=callback)
    print(" [*] Waiting for messages. To exit press CTRL+C")
    channel.start_consuming()

if __name__ == '__main__':
    consume_messages()
