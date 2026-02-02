FROM python:3.11-slim

WORKDIR /app

# Нужные системные либы (минимум) для sklearn/numpy + корректной установки
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY requirements.txt .

# 1) ставим CPU torch из официального индекса (компактнее, чем pytorch image)
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    torch==2.2.2

# 2) ставим остальные зависимости (torch уже установлен)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["bash", "-lc", "python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
