//! Local MCP endpoint. Requests are forwarded to the webview, which runs the tools on the live stores.
use std::{
  collections::HashMap,
  io::Read,
  sync::{
    atomic::{AtomicU64, Ordering},
    mpsc, Arc, Mutex,
  },
  time::Duration,
};
use tauri::{AppHandle, Emitter, State};
use tiny_http::{Header, Request, Response, Server};

const MAX_BODY: u64 = 4 * 1024 * 1024;
const TOOL_TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Default)]
pub struct McpState {
  server: Mutex<Option<Arc<Server>>>,
  pending: Arc<Mutex<HashMap<String, mpsc::Sender<String>>>>,
  next_id: Arc<AtomicU64>,
}

#[derive(Clone, serde::Serialize)]
struct McpRequest {
  id: String,
  body: String,
}

fn header<'a>(request: &'a Request, name: &'static str) -> Option<&'a str> {
  request.headers().iter().find(|h| h.field.equiv(name)).map(|h| h.value.as_str())
}

/// Browsers always send Origin, so refusing it stops web pages from reaching the local server.
fn refusal(request: &Request, token: &str) -> Option<u16> {
  if request.url().split('?').next() != Some("/mcp") {
    return Some(404);
  }
  if header(request, "Origin").is_some() {
    return Some(403);
  }
  if header(request, "Authorization") != Some(format!("Bearer {token}").as_str()) {
    return Some(401);
  }
  if *request.method() != tiny_http::Method::Post {
    return Some(405);
  }
  None
}

fn serve(
  mut request: Request,
  token: &str,
  app: &AppHandle,
  pending: &Mutex<HashMap<String, mpsc::Sender<String>>>,
  next_id: &AtomicU64,
) {
  if let Some(code) = refusal(&request, token) {
    let _ = request.respond(Response::empty(code));
    return;
  }
  let mut body = String::new();
  let limit = MAX_BODY + 1;
  if request.as_reader().take(limit).read_to_string(&mut body).is_err() || body.len() as u64 > MAX_BODY {
    let _ = request.respond(Response::empty(413));
    return;
  }
  let id = next_id.fetch_add(1, Ordering::Relaxed).to_string();
  let (sender, receiver) = mpsc::channel();
  pending.lock().unwrap().insert(id.clone(), sender);
  if app.emit("mcp-request", McpRequest { id: id.clone(), body }).is_err() {
    pending.lock().unwrap().remove(&id);
    let _ = request.respond(Response::empty(503));
    return;
  }
  let reply = receiver.recv_timeout(TOOL_TIMEOUT);
  pending.lock().unwrap().remove(&id);
  let _ = match reply {
    Ok(json) if json.is_empty() => request.respond(Response::empty(202)),
    Ok(json) => {
      let content_type = Header::from_bytes("Content-Type", "application/json").expect("static header");
      request.respond(Response::from_string(json).with_header(content_type))
    }
    Err(_) => request.respond(Response::empty(504)),
  };
}

#[tauri::command]
pub fn mcp_start(app: AppHandle, state: State<McpState>, token: String, port: u16) -> Result<(), String> {
  if token.len() < 32 {
    return Err("Jeton trop court.".into());
  }
  stop(&state);
  // Loopback only: nothing outside this computer can connect.
  let server = Arc::new(Server::http(("127.0.0.1", port)).map_err(|e| format!("Port {port} indisponible : {e}"))?);
  *state.server.lock().unwrap() = Some(server.clone());
  let pending = state.pending.clone();
  let next_id = state.next_id.clone();
  std::thread::spawn(move || {
    for request in server.incoming_requests() {
      let (app, token, pending, next_id) = (app.clone(), token.clone(), pending.clone(), next_id.clone());
      std::thread::spawn(move || serve(request, &token, &app, &pending, &next_id));
    }
  });
  Ok(())
}

fn stop(state: &McpState) {
  if let Some(server) = state.server.lock().unwrap().take() {
    server.unblock();
  }
}

#[tauri::command]
pub fn mcp_stop(state: State<McpState>) {
  stop(&state);
}

#[tauri::command]
pub fn mcp_respond(state: State<McpState>, id: String, response: String) {
  if let Some(sender) = state.pending.lock().unwrap().remove(&id) {
    let _ = sender.send(response);
  }
}
