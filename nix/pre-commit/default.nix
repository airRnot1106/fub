{ config, pkgs }:
{
  check.enable = true;
  settings.hooks = {
    denolint.enable = true;
    nil.enable = true;
    similarity-ts = rec {
      enable = true;
      package = pkgs.similarity;
      name = "similarity-ts";
      entry = "${package}/bin/similarity-ts . --print --threshold 0.87";
      files = "\\.(m?[jt]sx?|cjs|mjs|cts|mts)$";
    };
    treefmt = {
      enable = true;
      package = config.treefmt.build.wrapper;
    };
  };
}
