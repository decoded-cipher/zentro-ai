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

RUN code-server --install-extension cedricverlinden.cursor-dark

# Create settings directory and copy settings
RUN mkdir -p /home/coder/.local/share/code-server/User
COPY --chown=coder:coder settings.json /home/coder/.local/share/code-server/User/settings.json

WORKDIR /tmp/zentro

EXPOSE 8080

CMD ["code-server", "--auth", "none", "--bind-addr", "0.0.0.0:8080", "/tmp/zentro"]
