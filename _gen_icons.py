#!/usr/bin/env python3
# ==========================================================================
# _gen_icons.py — PWA 아이콘 렌더러 (외부 의존 0 · 표준 라이브러리 zlib 만 사용)
# --------------------------------------------------------------------------
# 홈(index.html)의 SVG 파비콘을 그대로 PNG 래스터로 재현한다. 매니페스트 아이콘은
# 실제 이미지 파일이 필요(data URI SVG 불가)하므로 여기서 assets/icon-{192,512}.png 를 생성.
# PIL/rsvg/inkscape 등 외부 도구 없이 순수 파이썬으로 그린다(4x 슈퍼샘플링 안티에일리어싱).
#
# 파비콘 원본(viewBox 0 0 32 32):
#   rect  fill #06060e               (배경)
#   circle cx16 cy16 r9  stroke #ff003c stroke-width1.5   (리티클 링: r 8.25~9.75)
#   circle cx16 cy16 r3  fill  #ff003c                    (중심 점)
# ==========================================================================
import struct, zlib, math, os

BG   = (0x06, 0x06, 0x0e)   # #06060e
MAG  = (0xff, 0x00, 0x3c)   # #ff003c
CX = CY = 16.0
DOT_R = 3.0
RING_INNER = 9.0 - 0.75     # stroke-width 1.5 → ±0.75
RING_OUTER = 9.0 + 0.75
SS = 4                      # 슈퍼샘플 배수 (안티에일리어싱)

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')


def sample(sx, sy):
    """SVG 좌표(0..32)에서의 픽셀 색."""
    d = math.hypot(sx - CX, sy - CY)
    if d <= DOT_R:
        return MAG
    if RING_INNER <= d <= RING_OUTER:
        return MAG
    return BG


def render(size):
    hi = size * SS
    # 슈퍼샘플 그리드 렌더 후 SS*SS 박스 다운샘플 평균.
    inv = 32.0 / hi
    # 각 최종 픽셀별 누적
    out = bytearray()
    for y in range(size):
        row = bytearray()
        for x in range(size):
            r = g = b = 0
            for oy in range(SS):
                sy = ((y * SS + oy) + 0.5) * inv
                for ox in range(SS):
                    sx = ((x * SS + ox) + 0.5) * inv
                    c = sample(sx, sy)
                    r += c[0]; g += c[1]; b += c[2]
            n = SS * SS
            row += bytes((r // n, g // n, b // n))
        out += b'\x00' + row   # 필터 타입 0 (None)
    return bytes(out)


def write_png(path, size):
    raw = render(size)
    comp = zlib.compress(raw, 9)

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
           chunk(b'IDAT', comp) + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    print('wrote %s (%dx%d, %d bytes)' % (path, size, size, len(png)))


if __name__ == '__main__':
    os.makedirs(ASSETS, exist_ok=True)
    write_png(os.path.join(ASSETS, 'icon-192.png'), 192)
    write_png(os.path.join(ASSETS, 'icon-512.png'), 512)
