# Deadlock Addon Manager

![App Screenshot](/.github/images/1.png "AppScreenshot")

## Installation

Download the latest version from the [releases page](https://github.com/coDiesIrae/citadel-content-manager/releases)

## Usage

- Running the application for the first time will open onboarding menu
- Addon storage directory is the directory where all of your addons (installed and not installed) are stored
  - This directory should **not** be in the game directory
  - This should be a directory that is not used for anything else
- Application will automatically detect the game directory
- Application will check your `gameinfo.gi` file
  - `Vanilla` means that the gameinfo file is in the default state
  - `Modded` means that the gameinfo file is in the modded state
  - `Custom` means that either the gameinfo file has had extra changes made to it (apart from required ones) or there was an error reading the file
- 'Stored' addons are addons that are in the addon storage directory
  - Installing (mounting) an addon will copy it from the storage directory to the `citadel/addons` directory
- 'Installed' (mounted) addons are addons that are in the `citadel/addons` directory
  - Uninstalling (unmounting) an addon will delete it from the `citadel/addons`, and, if it is not in the storage directory, will copy it to the storage directory

## Symlinks (Experimental)

You can enable symlink deployment in the settings menu. This will create symlinks to the addons in the storage directory instead of copying them. This is faster and uses less disk space, but may be less stable.

Requires that the storage directory is on the same drive as the game directory.

## License

Contents of this repository are available under [MIT license](LICENSE)

