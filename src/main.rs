use actix_files as fs;
use actix_web::{get, App, HttpRequest, HttpResponse, HttpServer, Responder};

/*
#[get("/")]
async fn index(_req: HttpRequest) -> impl Responder {
    HttpResponse::Ok().body("Hello, world!".to_string())
}
*/

#[actix::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(move || {
        App::new()
            //.service(index)
            .service(fs::Files::new("/", "./static/").index_file("index.html"))
    })
    .bind(("localhost", 8000))?
    .run()
    .await
}
