FROM codercom/code-server:latest

USER root

RUN apt-get update \
    && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /tmp/zentro && chown -R coder:coder /tmp/zentro

USER coder

RUN code-server --install-extension cedricverlinden.cursor-dark \
    && code-server --install-extension astro-build.astro-vscode \
    && code-server --install-extension ms-python.python \
    && code-server --install-extension ms-python.debugpy \
    && code-server --install-extension ms-python.vscode-python-envs \
    && code-server --install-extension svelte.svelte-vscode \
    && code-server --install-extension bradlc.vscode-tailwindcss \
    && code-server --install-extension Vue.volar

RUN mkdir -p /home/coder/.local/share/code-server/User
COPY --chown=coder:coder settings.json /home/coder/.local/share/code-server/User/settings.json

WORKDIR /tmp/zentro

EXPOSE 8080
EXPOSE 5173

CMD ["code-server", "--auth", "none", "--bind-addr", "0.0.0.0:8080", "/tmp/zentro"]
