use roga::*;
use serde_json::json;
use transport::console::ConsoleTransport;

fn main() {
    let logger = Logger::new()
        .with_transport(ConsoleTransport { ..Default::default() })
        .with_level(LoggerLevel::Trace)
        .with_label("Demo");

    println!("\n=== Basic Log Levels Demo ===");
    l_fatal!(logger, "Critical: Server is on fire!");
    l_error!(logger, "Error: Database connection failed");
    l_warn!(logger, "Warning: Disk space below 10%");
    l_info!(logger, "Info: Service started successfully");
    l_record!(logger, "Record: Request processed in 50 ms");
    l_debug!(logger, "Debug: Current memory usage: 45%");
    l_trace!(logger, "Trace: Entered function process_data()");

    println!("\n=== Multiple Arguments Demo ===");
    l_info!(logger, "Port: 3000 Status: active Protocol: https");

    println!("\n=== Different Data Types Demo ===");
    let number = 42;
    let text = "sample text";
    let flag = true;
    l_info!(logger, "Number: {} Text: {} Boolean: {}", number, text, flag);

    println!("\n=== JSON Pretty Print Demo ===");
    let data = json!({
        "timestamp": "2025-01-22 08:35:25",
        "user": "username",
        "session": {
            "ip": "192.168.1.1",
            "active": true
        },
        "metrics": {
            "requests": 1000,
            "response_time": "45ms"
        }
    });
    l_debug!(logger, "Session data: {}", data);

    println!("\n=== Multiple Labels Demo ===");
    let module_logger = logger.clone().with_label("UserModule").with_label("Auth");
    l_info!(module_logger, "User login successful");

    println!("\n=== Format String Demo ===");
    let current_time = "2025-01-22 08:35:25";
    let username = "username";
    l_info!(logger, format!("System check at {} by user {}", current_time, username));
}
