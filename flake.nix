{
  description = "Development environment for the JanitorAI modules and Prompt Inspector";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [ go nodejs python3 rustc cargo ];
          shellHook = ''
            echo "JanitorAI module dev shell"
            echo "Go, Node/TypeScript, Python and Rust tooling are available."
          '';
        };
      });
    };
}
