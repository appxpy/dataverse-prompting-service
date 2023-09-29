# Промтинг-сервис

## Описание

Чат-бот, задача которого является персонализация предложений для пользователей на основе их возраст, пола, заработной платы и т.д. 

## Структура проекта

![](structure.jpg)

## Стек разработки

- Python
- Django
- PostgreSQL
- Docker
- Nginx
- Vite.js
- Llama2

## Развертывание модели

1. Создать на удаленном сервере с GPU Dockerfile:

```dockerfile
ARG CUDA_IMAGE="12.1.1-devel-ubuntu22.04"
FROM nvidia/cuda:${CUDA_IMAGE}

# We need to set the host to 0.0.0.0 to allow outside access
ENV HOST 0.0.0.0

RUN apt-get update && apt-get upgrade -y \
&& apt-get install -y git build-essential \
python3 python3-pip gcc wget \
ocl-icd-opencl-dev opencl-headers clinfo \
libclblast-dev libopenblas-dev \
&& mkdir -p /etc/OpenCL/vendors && echo "libnvidia-opencl.so.1" > /etc/OpenCL/vendors/nvidia.icd

COPY . .

# setting build related env vars
ENV CUDA_DOCKER_ARCH=all
ENV LLAMA_CUBLAS=1

# Install depencencies
RUN python3 -m pip install --upgrade pip pytest cmake scikit-build setuptools fastapi uvicorn sse-starlette pydantic-settings

# Install llama-cpp-python (build with cuda)
RUN CMAKE_ARGS="-DLLAMA_CUBLAS=on" FORCE_CMAKE=1 pip install llama-cpp-python

# Run the server
CMD python3 -m llama_cpp.server
```

2. Переменовать созданный образ:

```bash
docker tag <image id> cuda-llama:latest
```

3. Скачать модель в заранее созданную папку `models`:

```bash
wget https://huggingface.co/TheBloke/Llama-2-70B-Chat-GGML/resolve/main/llama-2-70b-chat.ggmlv3.q4_K_S.bin -O llama-2-70b-chat.ggmlv3.q4_K_S.bin
```

4. Скачать файл конвертации модели в нужный формат:

```bash
wget https://raw.githubusercontent.com/ggerganov/llama.cpp/master/convert-llama-ggmlv3-to-gguf.py -O convert.py
```

5. Конвертировать модель в нужный формат:

```bash
python3 convert.py --eps 1e-5 --input llama-2-70b-chat.ggmlv3.q4_K_S.bin --output ./models/llama-2-70b-chat.gguf.q4_K_S.bin
```


6. Запустить вэб-сервер модели:

```bash
docker run --rm -it -p 8000:8000 -v ~/models:/models -e MODEL=/models/llama-2-13b-chat.gguf.q4_K_S.bin cuda-llama:latest
```

## Запуск проекта

1. Скачать Docker

2. Создать файл .env.backend.dev:

    ```env
    DEBUG=1
    SECRET_KEY=dev
    DJANGO_ALLOWED_HOSTS=localhost 127.0.0.1 [::1]
    ```

3. Запустить команду в терминале:

    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

На порту 8080 будет находиться бэкенд (REST API), а на порту 3000 - само приложение.

## Лицензия 

MIT License

Подробнее в файле [LICENSE](LICENSE).


