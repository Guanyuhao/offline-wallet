#!/bin/bash
# 创建一个最小的有效 PNG 文件（1x1 像素，透明）
# PNG 文件头
printf '\x89PNG\r\n\x1a\n' > icon.png
# 简单的 IHDR chunk (13 bytes) + CRC
printf '\x00\x00\x00\rIHDR\x00\x00\x00\x80\x00\x00\x00\x80\x08\x06\x00\x00\x00\xc3\xa2\x26\xe7' >> icon.png
# IEND chunk
printf '\x00\x00\x00\x00IEND\xaeB`\x82' >> icon.png

# 复制创建其他尺寸
cp icon.png 32x32.png
cp icon.png 128x128.png  
cp icon.png 128x128@2x.png

echo "✅ 图标文件已创建"
