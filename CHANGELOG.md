# Change Log

## [1.0.0] - 2025-01-09
- Initial release

## [1.0.2] - 2025-01-10
- Added icons and indents

## [1.0.3] - 2025-01-17
- arm-none-eabi-objdump and arm-none-eabi-nm are used to get more accurate results
- symbols now have links to source code

## [1.0.4] - 2025-01-21
- fixed a bug causing incorrect operations with sectors at address 0x00000000 (e.g., ITCMRAM)

## [1.0.5] - 2025-02-13
- the plugin worked only with the 'Debug' build type - fixed. now the plugin gets the build type name from the CMake Tools extension