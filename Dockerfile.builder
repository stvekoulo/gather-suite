# Image de compilation multi-plateformes Gather Suite pour VPS / OpenShift
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV RUSTUP_HOME=/usr/local/rustup
ENV CARGO_HOME=/usr/local/cargo
ENV PATH=/usr/local/cargo/bin:/usr/local/bin:$PATH

# Installation des dépendances système Linux et outils de compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    wget \
    file \
    pkg-config \
    libssl-dev \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    clang \
    lld \
    llvm \
    nsis \
    genisoimage \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Installation de Node.js 22 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Installation de Rust stable et des cibles Linux, Windows et macOS
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable \
    && rustup target add x86_64-unknown-linux-gnu \
    && rustup target add x86_64-pc-windows-msvc \
    && rustup target add x86_64-apple-darwin \
    && rustup target add aarch64-apple-darwin

# Installation des binaires precompiles cargo-xwin, cargo-zigbuild et zig pour Windows & macOS
RUN curl -fsSL https://github.com/rust-cross/cargo-xwin/releases/download/v0.23.1/cargo-xwin-v0.23.1.x86_64-unknown-linux-musl.tar.gz | tar -xz -C /usr/local/cargo/bin \
    && curl -fsSL https://github.com/rust-cross/cargo-zigbuild/releases/download/v0.24.0/cargo-zigbuild-x86_64-unknown-linux-musl.tar.xz | tar -xJ -C /usr/local/cargo/bin \
    && curl -fsSL https://ziglang.org/download/0.14.0/zig-linux-x86_64-0.14.0.tar.xz | tar -xJ -C /usr/local/bin --strip-components=1

# Installation du CLI GitHub officiel pour la publication des releases
RUN mkdir -p -m 755 /etc/apt/keyrings \
    && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Installation des dépendances du projet
RUN npm ci

# Commande par défaut : compilation et publication automatique
CMD ["node", "scripts/vps-release.mjs"]
