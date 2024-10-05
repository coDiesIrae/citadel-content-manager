mod game;

pub fn run_app() {
  let mut game = game::CitadelGame::new().unwrap();

  game.mod_search_paths().unwrap();

  println!("{:#?}", game);
}
