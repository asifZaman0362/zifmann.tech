use actix_files as fs;
use actix_web::{get, App, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_web::middleware::Logger;
use env_logger::Env;

/*
#[get("/")]
async fn index(_req: HttpRequest) -> impl Responder {
    HttpResponse::Ok().body("Hello, world!".to_string())
}
*/

#[actix::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(Env::default().default_filter_or("info"));
    HttpServer::new(move || {
        App::new()
            //.service(index)
            .wrap(Logger::default())
            .wrap(Logger::new("%a %{User-Agent}i"))
            .service(fs::Files::new("/", "./static/").index_file("index.html"))
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await
}
