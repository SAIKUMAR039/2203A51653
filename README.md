[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install -g json-server
# Start the JSON server
json-server --watch db.json --port 3000 --host 0.0.0.0
