#!/bin/bash

base_path=$(dirname $0)
cd $base_path

public_path=../public
fonts_path=$public_path/fonts
sdf_fonts_path=$public_path/sdf-fonts
overrides_path=$fonts_path/overrides.json

# Path to charset in public folder
charset_path=$public_path/charset.txt

# Font file extensions
font_exts=(.ttf .otf .woff .woff2)

# Overrides file schema
# All keys are optional. If a key is not present, the default value is used.
# {
#   "<font-name>": {
#     "msdf": {
#       "fontSize": number (default: 42),
#       "distanceRange": number (default: 4),
#     },
#     "ssdf": {
#       "fontSize": number (default: 42),
#       "distanceRange": number (default: 8),
#     }
#   }
# }

# This function takes a font name and a font size and generates a font using msdf-bmfont
function gen_font {
    # Name of font in fonts folder (with extension)
    font_name=$1

    # "msdf" or "ssdf"
    field_type=$2

    # Check that field_type is valid
    if [ $field_type != "msdf" ] && [ $field_type != "ssdf" ]; then
        echo "Invalid field type $field_type"
        exit 1
    fi

    # Check that the font exists
    if [ ! -f $fonts_path/$font_name ]; then
        echo "Font $font_name does not exist"
        exit 1
    fi

    bmfont_field_type=$field_type

    # If bmfont_field_type is "ssdf" change it to "sdf"
    # since this is what is used by msdf-bmfont
    if [ $bmfont_field_type = "ssdf" ]; then
        bmfont_field_type="sdf"
    fi

    # Remove the extension from the font name
    font_name_no_ext=${font_name%.*}

    # Extract override data for font + field type, if exists
    font_size=$(jq -r ".\"$font_name_no_ext\".$field_type.fontSize" $overrides_path)
    distance_range=$(jq -r ".\"$font_name_no_ext\".$field_type.distanceRange" $overrides_path)

    # If override data does not exist, use default values
    if [ $font_size = "null" ]; then
        font_size=42 # msdf-bmfont default
    fi

    if [ $distance_range = "null" ]; then
        distance_range=4 # msdf-bmfont default
    fi

    # Generate the font
    msdf-bmfont \
        --field-type $bmfont_field_type \
        --output-type json \
        --round-decimal 6 \
        --smart-size \
        --pot \
        --font-size $font_size \
        --distance-range $distance_range \
        --charset-file $charset_path $fonts_path/$font_name && \
    mv $fonts_path/$font_name_no_ext.json $sdf_fonts_path/$font_name_no_ext.$field_type.json && \
    mv $fonts_path/$font_name_no_ext.png $sdf_fonts_path/$font_name_no_ext.$field_type.png
}

# Make sure the sdf-fonts folder exists
mkdir -p $sdf_fonts_path

# For every font file in the fonts folder
# Generate an msdf and ssdf font
for font in $fonts_path/*; do
    for ext in "${font_exts[@]}"; do
        if [[ $font == *$ext ]]; then
            font_name=$(basename $font)
            gen_font $font_name "msdf"
            gen_font $font_name "ssdf"
        fi
    done
done
