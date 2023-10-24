use actix_files as fs;
use actix_web::dev::{fn_service, ServiceRequest, ServiceResponse};
use actix_web::http::StatusCode;
use actix_web::middleware::Logger;
use actix_web::{get, App, HttpResponseBuilder, HttpServer, Responder};
use env_logger::Env;
use fs::NamedFile;
use regex::{Regex, RegexBuilder};
use serde::Deserialize;
use std::collections::HashSet;
use std::io::{BufRead, BufReader, Read};
use std::process::{Command, Stdio};

#[derive(Deserialize)]
struct SearchQuery {
    term: String,
}

fn search_html_files(
    pattern: &str,
    directory: &str,
) -> Result<Vec<(usize, String)>, std::io::Error> {
    // Set up the rg command.
    let output = Command::new("rg")
        .arg("--line-number") // Include line numbers in the output.
        .arg("--no-filename") // Do not display the filenames.
        .arg("--multiline")
        .arg("--multiline-dotall")
        .arg("--type-add=html:.html") // Search only HTML files.
        .arg(format!("--type=html"))
        .arg("--with-filename")
        .arg(pattern) // The search pattern.
        .arg(directory) // The directory to search in.
        .stdout(Stdio::piped())
        .spawn()?
        .stdout
        .ok_or(std::io::Error::new(
            std::io::ErrorKind::Other,
            "Failed to open stdout",
        ))?;

    let reader = BufReader::new(output);
    let re = Regex::new(r"(.*):(\d+):.+").unwrap(); // Regex to match line numbers and content.

    let mut results = Vec::new();
    let mut seen_files = HashSet::new();

    for line in reader.lines() {
        if let Ok(line) = line {
            if let Some(captures) = re.captures(&line) {
                if let (Some(file_name), Some(line_num)) = (captures.get(1), captures.get(2)) {
                    // Ensure we process each file only once.
                    let file_name = file_name.as_str();
                    if !seen_files.contains(file_name) {
                        results.push((line_num.as_str().parse().unwrap(), file_name.to_string()));
                        seen_files.insert(file_name.to_string());
                    }
                }
            }
        }
    }

    Ok(results)
}

#[get("/search")]
async fn search_blog(info: actix_web::web::Query<SearchQuery>) -> impl Responder {
    let term = info.term.clone();
    let term = format!(
        r#"(<key>{term}</key>|<tag>{term}</tag>|<article id="post">.*?<h1>.*{term}.*?</h1>)"#
    );
    println!("search term {term}");
    let mut html = "".to_string();
    match search_html_files(term.as_str(), "./static/blog/") {
        Ok(results) => {
            for (_, filename) in &results {
                match NamedFile::open_async(filename).await {
                    Ok(mut file) => {
                        let mut buf = String::with_capacity(4096);
                        if let Ok(_) = file.read_to_string(&mut buf) {
                            let re = RegexBuilder::new(r#"(?s)<article id="post">.*?<h1>.*?</a.*>(.*?)</h1>.*?<p>(.*?)</p>.*?<p>(.*?)</p>.*</article>"#).build().unwrap();
                            let captures = re.captures(&buf);
                            if let Some(captures) = captures {
                                if let (Some(h1), Some(tag), Some(p)) =
                                    (captures.get(1), captures.get(2), captures.get(3))
                                {
                                    html += format!(
                                        "<li><a href=\"{}\"><article><h1>{}</h1><p>{}</p><p>{}</p></article></a></li>",
                                        filename.replace("./static/", ""),
                                        h1.as_str(),
                                        tag.as_str(),
                                        p.as_str()
                                    ).as_str();
                                }
                            }
                        }
                    }
                    Err(err) => {
                        return HttpResponseBuilder::new(StatusCode::INTERNAL_SERVER_ERROR)
                            .body(format!("{}", err));
                    }
                }
            }
            HttpResponseBuilder::new(StatusCode::OK).body(format!("<ul>{html}</ul>"))
        }
        Err(err) => {
            HttpResponseBuilder::new(StatusCode::INTERNAL_SERVER_ERROR).body(format!("{}", err))
        }
    }
}

#[actix::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(Env::default().default_filter_or("info"));
    HttpServer::new(move || {
        App::new()
            //.service(index)
            .wrap(Logger::default())
            .wrap(Logger::new("%a %{User-Agent}i"))
            .service(search_blog)
            .service(
                fs::Files::new("/", "./static/")
                    .use_hidden_files()
                    .index_file("index.html")
                    .default_handler(fn_service(|req: ServiceRequest| async {
                        let (req, _) = req.into_parts();
                        let file = NamedFile::open_async("./static/404.html").await?;
                        let res = file.into_response(&req);
                        Ok(ServiceResponse::new(req, res))
                    })),
            )
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await
}
