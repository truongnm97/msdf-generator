# Generate MSDF Textures

### Installation  

Make sure you have Node.js installed on your system. Then, run the following command to install dependencies:

`pnpm install`

### Instructions

1. Copy Fonts: Place all the font files you want to convert to (m)sdf fonts into the `public/fonts` directory.
2. Generate MSDF Textures: Run the following command to generate MSDF textures from the font files:

```
pnpm generate
```

3. Access Generated Files: The generated (m)sdf font files will be available in the `public/sdf-fonts` folder.

## Supported Font Extensions

The script supports the following font file extensions:

- .ttf
- .otf
- .woff
- .woff2
