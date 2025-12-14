//! 区块链交互模块（热钱包）
//!
//! 负责与区块链网络通信：余额查询、交易广播、交易历史等
//!
//! 支持的链：
//! - ETH: Etherscan V2 API
//! - BNB: Alchemy RPC
//! - SOL: Alchemy RPC
//! - TRON: TronScan API
//! - BTC: Blockstream API
//! - Kaspa: Kaspa Explorer API

use serde_json::{json, Value};

// ==================== 配置/日志/HTTP 基础设施 ====================

/// 从环境变量读取配置
fn env_var(key: &str) -> Option<String> {
    std::env::var(key).ok().filter(|s| !s.trim().is_empty())
}

/// 是否开启 API req/res 日志
/// - debug 模式默认开启
/// - 也可通过环境变量 `HOT_WALLET_API_LOG=1` 强制开启
fn api_log_enabled() -> bool {
    cfg!(debug_assertions) || env_var("HOT_WALLET_API_LOG").as_deref() == Some("1")
}

fn log_api_req(method: &str, url: &str) {
    if api_log_enabled() {
        println!("[API REQ] {} {}", method, url);
    }
}

fn log_api_res(label: &str, body: &str) {
    if !api_log_enabled() {
        return;
    }
    let preview = if body.len() > 500 {
        format!("{}...(truncated)", &body[..500])
    } else {
        body.to_string()
    };
    println!("[API RES] {} => {}", label, preview);
}

fn log_api_err(label: &str, err: &str) {
    println!("[API ERR] {} => {}", label, err);
}

/// 通用 HTTP 客户端（带超时）
fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
}

// ==================== API Key 配置 ====================

/// Etherscan V2 API Key（从环境变量读取，用于 ETH）
fn etherscan_api_key() -> String {
    env_var("ETHERSCAN_API_KEY").unwrap_or_else(|| "A8GU4QTDKK9RZ1543HTI6XHZ5XK8ZTKBS1".to_string())
}

/// Alchemy API Key（从环境变量读取，用于 BNB/SOL）
fn alchemy_api_key() -> String {
    env_var("ALCHEMY_API_KEY").unwrap_or_else(|| "8bShNa2xN8wmrxHmAu1HW".to_string())
}

/// TronScan API Key（从环境变量读取）
fn tronscan_api_key() -> String {
    env_var("TRONSCAN_API_KEY").unwrap_or_else(|| "57175201-d10c-48bb-996b-88b8433af921".to_string())
}

// ==================== RPC URL 配置 ====================

/// Alchemy BNB RPC URL
fn alchemy_bnb_rpc() -> String {
    env_var("ALCHEMY_BNB_RPC_URL")
        .unwrap_or_else(|| format!("https://bnb-mainnet.g.alchemy.com/v2/{}", alchemy_api_key()))
}

/// Alchemy SOL RPC URL
fn alchemy_sol_rpc() -> String {
    env_var("ALCHEMY_SOL_RPC_URL")
        .unwrap_or_else(|| format!("https://solana-mainnet.g.alchemy.com/v2/{}", alchemy_api_key()))
}

/// ETH 公共 RPC（余额查询用）
fn eth_rpc_url() -> &'static str {
    "https://eth.llamarpc.com"
}

// ==================== HTTP 客户端工厂 ====================

/// TronScan 客户端（带 API Key header）
fn tronscan_client() -> reqwest::Client {
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("TRON-PRO-API-KEY", tronscan_api_key().parse().unwrap());
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .default_headers(headers)
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
}

// ==================== 通用 RPC 请求 ====================

/// JSON-RPC POST 请求（通用）
async fn rpc_post(url: &str, label: &str, payload: Value) -> Result<Value, String> {
    log_api_req("POST", url);
    
    let response = http_client()
        .post(url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| {
            log_api_err(label, &e.to_string());
            format!("Network request failed: {}", e)
        })?;

    let text = response.text().await.map_err(|e| {
        log_api_err(label, &e.to_string());
        format!("Failed to read response: {}", e)
    })?;
    
    log_api_res(label, &text);
    
    serde_json::from_str(&text).map_err(|e| format!("Failed to parse response: {}", e))
}

/// HTTP GET 请求（通用）
async fn http_get(url: &str, label: &str, client: reqwest::Client) -> Result<Value, String> {
    log_api_req("GET", url);
    
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| {
            log_api_err(label, &e.to_string());
            format!("Network request failed: {}", e)
        })?;

    let text = response.text().await.map_err(|e| {
        log_api_err(label, &e.to_string());
        format!("Failed to read response: {}", e)
    })?;
    
    log_api_res(label, &text);
    
    serde_json::from_str(&text).map_err(|e| format!("Failed to parse response: {}", e))
}

// ==================== 公共 API ====================

/// 获取账户余额
pub async fn get_balance(chain: &str, address: &str) -> Result<String, String> {
    match chain {
        "eth" => get_eth_balance(address).await,
        "btc" => get_btc_balance(address).await,
        "sol" => get_sol_balance(address).await,
        "bnb" => get_bnb_balance(address).await,
        "tron" => get_tron_balance(address).await,
        "kaspa" => get_kaspa_balance(address).await,
        _ => Err(format!("Unsupported chain: {}", chain)),
    }
}

/// 广播交易
pub async fn broadcast_transaction(chain: &str, signed_tx: String) -> Result<String, String> {
    match chain {
        "eth" => broadcast_eth_transaction(&signed_tx).await,
        "btc" => broadcast_btc_transaction(&signed_tx).await,
        "sol" => broadcast_sol_transaction(&signed_tx).await,
        "bnb" => broadcast_bnb_transaction(&signed_tx).await,
        "tron" => broadcast_tron_transaction(&signed_tx).await,
        "kaspa" => broadcast_kaspa_transaction(&signed_tx).await,
        _ => Err(format!("Unsupported chain: {}", chain)),
    }
}

/// 获取交易历史
pub async fn get_transaction_history(chain: &str, address: &str) -> Result<String, String> {
    match chain {
        "eth" => get_eth_transaction_history(address).await,
        "btc" => get_btc_transaction_history(address).await,
        "sol" => get_sol_transaction_history(address).await,
        "bnb" => get_bnb_transaction_history(address).await,
        "tron" => get_tron_transaction_history(address).await,
        "kaspa" => get_kaspa_transaction_history(address).await,
        _ => Err(format!("Unsupported chain: {}", chain)),
    }
}

/// 估算 Gas 费用
pub async fn estimate_gas(chain: &str, _tx_data: &str) -> Result<String, String> {
    match chain {
        "eth" | "bnb" => Ok("21000".to_string()),
        "btc" => Ok("1000".to_string()),
        "sol" => Ok("5000".to_string()),
        "tron" => Ok("0".to_string()),
        "kaspa" => Ok("1000".to_string()),
        _ => Err(format!("Unsupported chain: {}", chain)),
    }
}

/// 获取账户 nonce（EVM 链）
pub async fn get_nonce(chain: &str, address: &str) -> Result<String, String> {
    let rpc_url = match chain {
        "eth" => eth_rpc_url().to_string(),
        "bnb" => alchemy_bnb_rpc(),
        _ => return Err(format!("Nonce not supported for chain: {}", chain)),
    };

    let payload = json!({
        "jsonrpc": "2.0",
        "method": "eth_getTransactionCount",
        "params": [address, "latest"],
        "id": 1
    });

    let json = rpc_post(&rpc_url, &format!("{} nonce", chain.to_uppercase()), payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    let hex_nonce = json["result"].as_str().ok_or("Invalid response format")?;
    let nonce = u64::from_str_radix(hex_nonce.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Failed to parse nonce: {}", e))?;
    
    Ok(nonce.to_string())
}

/// 获取当前 Gas Price（EVM 链，返回 Gwei）
pub async fn get_gas_price(chain: &str) -> Result<String, String> {
    let rpc_url = match chain {
        "eth" => eth_rpc_url().to_string(),
        "bnb" => alchemy_bnb_rpc(),
        _ => return Err(format!("Gas price not supported for chain: {}", chain)),
    };

    let payload = json!({
        "jsonrpc": "2.0",
        "method": "eth_gasPrice",
        "params": [],
        "id": 1
    });

    let json = rpc_post(&rpc_url, &format!("{} gasPrice", chain.to_uppercase()), payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    let hex_price = json["result"].as_str().ok_or("Invalid response format")?;
    let wei = u128::from_str_radix(hex_price.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Failed to parse gas price: {}", e))?;
    
    // 转换为 Gwei（智能精度：小于 1 时保留更多小数位）
    let gwei = wei as f64 / 1e9;
    if gwei < 1.0 {
        // BNB 等低 gas price 链，保留更多精度
        Ok(format!("{:.4}", gwei).trim_end_matches('0').trim_end_matches('.').to_string())
    } else {
        // ETH 等正常 gas price，保留 2 位小数
        Ok(format!("{:.2}", gwei))
    }
}

/// 获取交易参数（nonce + gasPrice，用于构建交易）
pub async fn get_tx_params(chain: &str, address: &str) -> Result<String, String> {
    match chain {
        "eth" | "bnb" => {
            let nonce = get_nonce(chain, address).await?;
            let gas_price = get_gas_price(chain).await?;
            
            Ok(serde_json::to_string(&json!({
                "nonce": nonce,
                "gasPrice": gas_price,
                "gasLimit": "21000"
            })).unwrap())
        }
        "tron" => {
            // TRON 不需要 nonce 和 gasPrice
            Ok(serde_json::to_string(&json!({
                "fee": "0"
            })).unwrap())
        }
        _ => {
            // BTC, SOL, KASPA 等
            Ok(serde_json::to_string(&json!({})).unwrap())
        }
    }
}

// ==================== ETH 实现 (Etherscan V2) ====================

async fn get_eth_balance(address: &str) -> Result<String, String> {
    let payload = json!({
        "jsonrpc": "2.0",
        "method": "eth_getBalance",
        "params": [address, "latest"],
        "id": 1
    });

    let json = rpc_post(eth_rpc_url(), "ETH balance", payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    let hex_balance = json["result"].as_str().ok_or("Invalid response format")?;
    let wei = u128::from_str_radix(hex_balance.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Failed to parse balance: {}", e))?;
    
    Ok(format!("{:.8}", wei as f64 / 1e18))
}

async fn broadcast_eth_transaction(signed_tx: &str) -> Result<String, String> {
    let payload = json!({
        "jsonrpc": "2.0",
        "method": "eth_sendRawTransaction",
        "params": [signed_tx],
        "id": 1
    });

    let json = rpc_post(eth_rpc_url(), "ETH broadcast", payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    json["result"].as_str().map(|s| s.to_string()).ok_or("Invalid response format".to_string())
}

async fn get_eth_transaction_history(address: &str) -> Result<String, String> {
    let api_url = format!(
        "https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address={}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey={}",
        address, etherscan_api_key()
    );

    let json = http_get(&api_url, "ETH txlist", http_client()).await?;
    
    let mut result = Vec::new();
    if let Some(txs) = json["result"].as_array() {
        for tx in txs.iter().take(10) {
            let from = tx["from"].as_str().unwrap_or("");
            let value_wei = tx["value"].as_str().unwrap_or("0");
            let timestamp = tx["timeStamp"].as_str().unwrap_or("0").parse::<u64>().unwrap_or(0);
            
            let wei = value_wei.parse::<u128>().unwrap_or(0);
            let is_outgoing = from.to_lowercase() == address.to_lowercase();
            
            result.push(json!({
                "hash": tx["hash"].as_str().unwrap_or(""),
                "from": if is_outgoing { address } else { "" },
                "to": if is_outgoing { "" } else { address },
                "value": format!("{:.8}", wei as f64 / 1e18),
                "timestamp": timestamp,
                "blockNumber": tx["blockNumber"].as_str().unwrap_or("0").parse::<u64>().ok(),
                "status": if tx["isError"].as_str().unwrap_or("0") == "0" { "success" } else { "failed" },
            }));
        }
    }
    
    Ok(serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string()))
}

// ==================== BNB 实现 (Alchemy) ====================

async fn get_bnb_balance(address: &str) -> Result<String, String> {
    let payload = json!({
        "jsonrpc": "2.0",
        "method": "eth_getBalance",
        "params": [address, "latest"],
        "id": 1
    });

    let json = rpc_post(&alchemy_bnb_rpc(), "BNB balance", payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    let hex_balance = json["result"].as_str().ok_or("Invalid response format")?;
    let wei = u128::from_str_radix(hex_balance.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Failed to parse balance: {}", e))?;
    
    Ok(format!("{:.8}", wei as f64 / 1e18))
}

async fn broadcast_bnb_transaction(signed_tx: &str) -> Result<String, String> {
    let payload = json!({
        "jsonrpc": "2.0",
        "method": "eth_sendRawTransaction",
        "params": [signed_tx],
        "id": 1
    });

    let json = rpc_post(&alchemy_bnb_rpc(), "BNB broadcast", payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    json["result"].as_str().map(|s| s.to_string()).ok_or("Invalid response format".to_string())
}

async fn get_bnb_transaction_history(address: &str) -> Result<String, String> {
    // 使用 Alchemy alchemy_getAssetTransfers API
    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "alchemy_getAssetTransfers",
        "params": [{
            "fromBlock": "0x0",
            "toBlock": "latest",
            "fromAddress": address,
            "category": ["external", "erc20"],
            "maxCount": "0xa",
            "order": "desc"
        }]
    });

    let json_from = rpc_post(&alchemy_bnb_rpc(), "BNB txlist (from)", payload).await?;

    // 也查询接收的交易
    let payload_to = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "alchemy_getAssetTransfers",
        "params": [{
            "fromBlock": "0x0",
            "toBlock": "latest",
            "toAddress": address,
            "category": ["external", "erc20"],
            "maxCount": "0xa",
            "order": "desc"
        }]
    });

    let json_to = rpc_post(&alchemy_bnb_rpc(), "BNB txlist (to)", payload_to).await?;

    let mut result = Vec::new();
    
    // 解析发送的交易
    if let Some(transfers) = json_from["result"]["transfers"].as_array() {
        for tx in transfers.iter().take(5) {
            let value = tx["value"].as_f64().unwrap_or(0.0);
            result.push(json!({
                "hash": tx["hash"].as_str().unwrap_or(""),
                "from": address,
                "to": "",
                "value": format!("{:.8}", value),
                "timestamp": 0, // Alchemy 不直接返回时间戳
                "blockNumber": tx["blockNum"].as_str().and_then(|s| u64::from_str_radix(s.trim_start_matches("0x"), 16).ok()),
                "status": "success",
            }));
        }
    }

    // 解析接收的交易
    if let Some(transfers) = json_to["result"]["transfers"].as_array() {
        for tx in transfers.iter().take(5) {
            let value = tx["value"].as_f64().unwrap_or(0.0);
            result.push(json!({
                "hash": tx["hash"].as_str().unwrap_or(""),
                "from": "",
                "to": address,
                "value": format!("{:.8}", value),
                "timestamp": 0,
                "blockNumber": tx["blockNum"].as_str().and_then(|s| u64::from_str_radix(s.trim_start_matches("0x"), 16).ok()),
                "status": "success",
            }));
        }
    }

    // 按区块号排序（降序）
    result.sort_by(|a, b| {
        let block_a = a["blockNumber"].as_u64().unwrap_or(0);
        let block_b = b["blockNumber"].as_u64().unwrap_or(0);
        block_b.cmp(&block_a)
    });

    // 只保留前10条
    result.truncate(10);
    
    Ok(serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string()))
}

// ==================== SOL 实现 (Alchemy) ====================

async fn get_sol_balance(address: &str) -> Result<String, String> {
    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getBalance",
        "params": [address]
    });

    let json = rpc_post(&alchemy_sol_rpc(), "SOL balance", payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    let lamports = json["result"]["value"].as_u64().unwrap_or(0);
    Ok(format!("{:.9}", lamports as f64 / 1e9))
}

async fn broadcast_sol_transaction(signed_tx: &str) -> Result<String, String> {
    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendTransaction",
        "params": [signed_tx, {"encoding": "base64"}]
    });

    let json = rpc_post(&alchemy_sol_rpc(), "SOL broadcast", payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    json["result"].as_str().map(|s| s.to_string()).ok_or("Invalid response format".to_string())
}

async fn get_sol_transaction_history(address: &str) -> Result<String, String> {
    // 使用 Alchemy getSignaturesForAddress API
    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getSignaturesForAddress",
        "params": [address, {"limit": 10}]
    });

    let json = rpc_post(&alchemy_sol_rpc(), "SOL txlist", payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    let mut result = Vec::new();
    if let Some(signatures) = json["result"].as_array() {
        for sig in signatures.iter().take(10) {
            let signature = sig["signature"].as_str().unwrap_or("");
            let block_time = sig["blockTime"].as_u64().unwrap_or(0);
            let err = sig["err"].is_null();
            
            result.push(json!({
                "hash": signature,
                "from": "",
                "to": "",
                "value": "0", // getSignaturesForAddress 不返回金额，需要额外调用 getTransaction
                "timestamp": block_time,
                "status": if err { "success" } else { "failed" },
            }));
        }
    }
    
    Ok(serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string()))
}

// ==================== TRON 实现 (TronScan) ====================

async fn get_tron_balance(address: &str) -> Result<String, String> {
    let api_url = format!(
        "https://apilist.tronscanapi.com/api/accountv2?address={}",
        address
    );

    let json = http_get(&api_url, "TRON balance", tronscan_client()).await?;

    let sun = json["balance"].as_u64()
        .or_else(|| json["balance"].as_str().and_then(|s| s.parse().ok()))
        .unwrap_or(0);
    
    Ok(format!("{:.6}", sun as f64 / 1e6))
}

async fn broadcast_tron_transaction(signed_tx: &str) -> Result<String, String> {
    let api_url = "https://api.trongrid.io/wallet/broadcasttransaction";
    log_api_req("POST", api_url);
    
    let response = http_client()
        .post(api_url)
        .header("Content-Type", "application/json")
        .body(signed_tx.to_string())
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    let json: Value = response.json().await.map_err(|e| format!("Failed to parse response: {}", e))?;

    json["txid"].as_str().map(|s| s.to_string()).ok_or("Invalid response format".to_string())
}

async fn get_tron_transaction_history(address: &str) -> Result<String, String> {
    let api_url = format!(
        "https://apilist.tronscanapi.com/api/transaction?sort=-timestamp&limit=10&start=0&address={}",
        address
    );

    let json = http_get(&api_url, "TRON txlist", tronscan_client()).await?;

    let mut result = Vec::new();
    if let Some(txs) = json["data"].as_array() {
        for tx in txs.iter().take(10) {
            let from = tx["ownerAddress"].as_str().unwrap_or("");
            let amount = tx["contractData"]["amount"].as_u64()
                .or_else(|| tx["amount"].as_u64())
                .unwrap_or(0);
            let is_outgoing = from.to_lowercase() == address.to_lowercase();

            result.push(json!({
                "hash": tx["hash"].as_str().unwrap_or(""),
                "from": if is_outgoing { address } else { "" },
                "to": if is_outgoing { "" } else { address },
                "value": format!("{:.6}", amount as f64 / 1e6),
                "timestamp": tx["timestamp"].as_u64().unwrap_or(0) / 1000,
                "blockNumber": tx["block"].as_u64(),
                "status": if tx["confirmed"].as_bool().unwrap_or(true) { "success" } else { "pending" },
            }));
        }
    }
    
    Ok(serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string()))
}

// ==================== BTC 实现 (Blockstream) ====================

async fn get_btc_balance(address: &str) -> Result<String, String> {
    let api_url = format!("https://blockstream.info/api/address/{}", address);

    let json = http_get(&api_url, "BTC balance", http_client()).await?;

    let chain_stats = json["chain_stats"].as_object().ok_or("Invalid response format")?;
    let funded = chain_stats["funded_txo_sum"].as_u64().unwrap_or(0);
    let spent = chain_stats["spent_txo_sum"].as_u64().unwrap_or(0);
    
    Ok(format!("{:.8}", (funded.saturating_sub(spent)) as f64 / 1e8))
}

async fn broadcast_btc_transaction(signed_tx: &str) -> Result<String, String> {
    let api_url = "https://blockstream.info/api/tx";
    log_api_req("POST", api_url);
    
    let response = http_client()
        .post(api_url)
        .body(signed_tx.to_string())
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    response.text().await.map_err(|e| format!("Failed to parse response: {}", e))
}

async fn get_btc_transaction_history(address: &str) -> Result<String, String> {
    let api_url = format!("https://blockstream.info/api/address/{}/txs", address);

    let txs = http_get(&api_url, "BTC txlist", http_client()).await?;
    
    let mut result = Vec::new();
    if let Some(array) = txs.as_array() {
        for tx in array.iter().take(10) {
            let txid = tx["txid"].as_str().unwrap_or("");
            let timestamp = tx["status"]["block_time"].as_u64().unwrap_or(0);
            
            // 计算收入
            let mut received: u64 = 0;
            if let Some(vouts) = tx["vout"].as_array() {
                for vout in vouts {
                    if vout["scriptpubkey_address"].as_str().unwrap_or("") == address {
                        received += vout["value"].as_u64().unwrap_or(0);
                    }
                }
            }
            
            // 计算支出
            let mut sent: u64 = 0;
            if let Some(vins) = tx["vin"].as_array() {
                for vin in vins {
                    if vin["prevout"]["scriptpubkey_address"].as_str().unwrap_or("") == address {
                        sent += vin["prevout"]["value"].as_u64().unwrap_or(0);
                    }
                }
            }
            
            let net = received as i64 - sent as i64;
            let is_outgoing = net < 0;
            let value = net.unsigned_abs();
            
            result.push(json!({
                "hash": txid,
                "from": if is_outgoing { address } else { "" },
                "to": if is_outgoing { "" } else { address },
                "value": format!("{:.8}", value as f64 / 1e8),
                "timestamp": timestamp,
                "blockNumber": tx["status"]["block_height"].as_u64(),
                "status": if tx["status"]["confirmed"].as_bool().unwrap_or(false) { "success" } else { "pending" },
            }));
        }
    }
    
    Ok(serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string()))
}

// ==================== Kaspa 实现 (Kaspa Explorer) ====================

async fn get_kaspa_balance(address: &str) -> Result<String, String> {
    let api_url = format!("https://api.kaspa.org/addresses/{}/balance", address);

    let json = http_get(&api_url, "KASPA balance", http_client()).await?;

    let balance = json["balance"].as_u64().unwrap_or(0);
    Ok(format!("{:.8}", balance as f64 / 1e8))
}

async fn broadcast_kaspa_transaction(_signed_tx: &str) -> Result<String, String> {
    // TODO: Kaspa 交易广播实现
    Err("Kaspa broadcast not yet implemented".to_string())
}

async fn get_kaspa_transaction_history(address: &str) -> Result<String, String> {
    let api_url = format!(
        "https://api.kaspa.org/addresses/{}/full-transactions?limit=10&resolve_previous_outpoints=light",
        address
    );

    let txs = http_get(&api_url, "KASPA txlist", http_client()).await?;
    
    let mut result = Vec::new();
    if let Some(array) = txs.as_array() {
        for tx in array.iter() {
            let tx_id = tx["transaction_id"].as_str().unwrap_or("");
            let block_time = tx["block_time"].as_u64().unwrap_or(0);
            
            // 计算收入
            let mut received: u64 = 0;
            if let Some(outputs) = tx["outputs"].as_array() {
                for output in outputs {
                    if output["script_public_key_address"].as_str().unwrap_or("") == address {
                        received += output["amount"].as_u64().unwrap_or(0);
                    }
                }
            }
            
            // 计算支出
            let mut sent: u64 = 0;
            if let Some(inputs) = tx["inputs"].as_array() {
                for input in inputs {
                    if input["previous_outpoint_address"].as_str().unwrap_or("") == address {
                        sent += input["previous_outpoint_amount"].as_u64().unwrap_or(0);
                    }
                }
            }
            
            let is_outgoing = sent > 0;
            let value = if is_outgoing {
                if sent > received { sent - received } else { 0 }
            } else {
                received
            };
            
            result.push(json!({
                "hash": tx_id,
                "from": if is_outgoing { address } else { "" },
                "to": if is_outgoing { "" } else { address },
                "value": format!("{:.8}", value as f64 / 1e8),
                "timestamp": block_time / 1000,
                "status": "success",
            }));
        }
    }
    
    Ok(serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string()))
}

// ==================== 代币余额查询 ====================

/// 代币合约地址配置
fn get_token_contracts(chain: &str) -> Vec<(&'static str, &'static str, u8)> {
    match chain {
        "eth" => vec![
            ("USDT", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6),
            ("USDC", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6),
        ],
        "bnb" => vec![
            ("USDT", "0x55d398326f99059fF775485246999027B3197955", 18),
            ("USDC", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", 18),
        ],
        "tron" => vec![
            ("USDT", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 6),
            ("USDC", "TLZSucJRjnqBKwvQz6n5hd29gbS4P7u7w8", 6),
            ("USDD", "TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz", 18),
        ],
        _ => vec![],
    }
}

/// 查询 ERC20/BEP20 代币余额
async fn get_evm_token_balance(chain: &str, address: &str, contract: &str, decimals: u8) -> Result<f64, String> {
    let rpc_url = match chain {
        "eth" => eth_rpc_url().to_string(),
        "bnb" => alchemy_bnb_rpc(),
        _ => return Ok(0.0),
    };

    // ERC20 balanceOf(address) 方法
    let address_padded = format!("000000000000000000000000{}", address.trim_start_matches("0x"));
    let data = format!("0x70a08231{}", address_padded);

    let payload = json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": contract, "data": data}, "latest"],
        "id": 1
    });

    let json = rpc_post(&rpc_url, &format!("{} token", chain.to_uppercase()), payload).await?;

    if let Some(error) = json.get("error") {
        return Err(format!("RPC error: {}", error));
    }

    let hex_balance = json["result"].as_str().unwrap_or("0x0");
    let balance = u128::from_str_radix(hex_balance.trim_start_matches("0x"), 16).unwrap_or(0);
    
    Ok(balance as f64 / 10u128.pow(decimals as u32) as f64)
}

/// 批量获取 TRC20 代币余额
async fn get_trc20_token_balances(address: &str, tokens: &[(&str, &str, u8)]) -> Vec<(String, f64)> {
    let api_url = format!(
        "https://apilist.tronscanapi.com/api/accountv2?address={}",
        address
    );

    let json = match http_get(&api_url, "TRC20 tokens", tronscan_client()).await {
        Ok(j) => j,
        Err(e) => {
            log_api_err("TRC20 tokens", &e);
            return tokens.iter().map(|(s, _, _)| (s.to_string(), 0.0)).collect();
        }
    };

    let mut result = Vec::new();
    for (symbol, contract, decimals) in tokens {
        let mut balance = 0.0;

        if let Some(token_list) = json["withPriceTokens"].as_array() {
            for token in token_list {
                if token["tokenId"].as_str().unwrap_or("") == *contract {
                    let raw_balance = token["balance"].as_str()
                        .unwrap_or("0")
                        .parse::<u128>()
                        .unwrap_or(0);
                    balance = raw_balance as f64 / 10u128.pow(*decimals as u32) as f64;
                    break;
                }
            }
        }

        result.push((symbol.to_string(), balance));
    }

    result
}

/// 获取所有代币余额
pub async fn get_token_balances(chain: &str, address: &str) -> Result<String, String> {
    let tokens = get_token_contracts(chain);
    let mut result = Vec::new();

    match chain {
        "eth" | "bnb" => {
            for (symbol, contract, decimals) in tokens {
                let balance = get_evm_token_balance(chain, address, contract, decimals)
                    .await
                    .unwrap_or(0.0);
                
                result.push(json!({
                    "symbol": symbol,
                    "contract": contract,
                    "balance": format!("{:.6}", balance),
                    "decimals": decimals,
                }));
            }
        }
        "tron" => {
            let balances = get_trc20_token_balances(address, &tokens).await;
            
            for ((symbol, contract, decimals), (_, balance)) in tokens.iter().zip(balances.iter()) {
                result.push(json!({
                    "symbol": symbol,
                    "contract": contract,
                    "balance": format!("{:.6}", balance),
                    "decimals": decimals,
                }));
            }
        }
        _ => {}
    }

    Ok(serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string()))
}
