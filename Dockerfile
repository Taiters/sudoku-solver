# FROM python:3.12 

# WORKDIR /notebooks

# RUN adduser jupyter && \
#     apt-get update && \
#     apt-get install ffmpeg libsm6 libxext6 tesseract-ocr -y &&\
#     chown -R jupyter:jupyter /notebooks && \
#     pip install \
#     jupyterlab \
#     matplotlib \
#     opencv-python \
#     pandas \
#     tensorflow[and-cuda] \
#     keras \
#     pytesseract

# USER jupyter

FROM tensorflow/tensorflow:latest-gpu

WORKDIR /notebooks

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 tesseract-ocr -y &&\
    pip install \
    jupyterlab \
    matplotlib \
    opencv-python \
    pandas \
    keras \
    pytesseract
