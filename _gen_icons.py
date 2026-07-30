#!/usr/bin/env python3
# ==========================================================================
# _gen_icons.py — PWA 아이콘 렌더러 (외부 의존 0 · 표준 라이브러리 zlib 만 사용)
# --------------------------------------------------------------------------
# 홈(index.html)의 SVG 파비콘을 그대로 PNG 래스터로 재현한다. 매니페스트 아이콘은
# 실제 이미지 파일이 필요(data URI SVG 불가)하므로 여기서 assets/*.png 를 생성.
# PIL/rsvg/inkscape 등 외부 도구 없이 순수 파이썬으로 그린다(4x 슈퍼샘플링 안티에일리어싱).
#   ※ 이 환경에는 Pillow 가 없다(python3 -c "import PIL" → ModuleNotFoundError).
#     애초에 필요 없다 — 렌더러는 zlib/struct/math 만 쓴다.
#
# 파비콘 원본(viewBox 0 0 32 32):
#   rect  fill #06060e               (배경)
#   circle cx16 cy16 r9  stroke #ff003c stroke-width1.5   (리티클 링: r 8.25~9.75)
#   circle cx16 cy16 r3  fill  #ff003c                    (중심 점)
#
# [v6.53] 산출물 확장 — 매니페스트 심화(maskable + shortcuts)에 필요한 자산 생성.
#   icon-192 / icon-512            : purpose "any" (기존과 바이트 동일 — 회귀 금지)
#   icon-maskable-512              : purpose "maskable". 안전영역(중앙 80% 원) 안에
#                                    콘텐츠가 완전히 들어가도록 리티클을 0.62배 축소하고
#                                    배경은 full-bleed. 어떤 마스크(원/스퀴클/라운드)로
#                                    잘려도 링이 온전히 남는다.
#   shortcut-{sim,rpg,kit}-96      : 매니페스트 shortcuts 아이콘. 트랙 강조색으로만 구분
#                                    (시안/마젠타/옐로) — 형상은 동일 리티클.
# ==========================================================================
import struct, zlib, math, os

BG   = (0x06, 0x06, 0x0e)   # #06060e
MAG  = (0xff, 0x00, 0x3c)   # #ff003c  (RPG · 기본 파비콘)
CYAN = (0x00, 0xe5, 0xff)   # #00e5ff  (시뮬)
YELL = (0xff, 0xd7, 0x00)   # #ffd700  (프린트 킷)
CX = CY = 16.0
DOT_R = 3.0
RING_INNER = 9.0 - 0.75     # stroke-width 1.5 → ±0.75
RING_OUTER = 9.0 + 0.75
SS = 4                      # 슈퍼샘플 배수 (안티에일리어싱)

# maskable 안전영역: 사양상 중앙 지름 80% 원 안이 항상 보인다.
# 원본 링 지름 = 19.5/32 = 0.609 → 0.62 배 축소하면 0.378 로 안전영역 절반 이하.
MASKABLE_SCALE = 0.62

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')


def sample(sx, sy, fg=MAG, scale=1.0):
    """SVG 좌표(0..32)에서의 픽셀 색. scale<1 이면 중심 기준으로 리티클을 축소."""
    d = math.hypot(sx - CX, sy - CY) / scale
    if d <= DOT_R:
        return fg
    if RING_INNER <= d <= RING_OUTER:
        return fg
    return BG


def render(size, fg=MAG, scale=1.0):
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
                    c = sample(sx, sy, fg, scale)
                    r += c[0]; g += c[1]; b += c[2]
            n = SS * SS
            row += bytes((r // n, g // n, b // n))
        out += b'\x00' + row   # 필터 타입 0 (None)
    return bytes(out)


def write_png(path, size, fg=MAG, scale=1.0):
    raw = render(size, fg, scale)
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
    # purpose "any" — 기존 산출물(바이트 동일 유지)
    write_png(os.path.join(ASSETS, 'icon-192.png'), 192)
    write_png(os.path.join(ASSETS, 'icon-512.png'), 512)
    # purpose "maskable" — 안전영역 준수 전용본
    write_png(os.path.join(ASSETS, 'icon-maskable-512.png'), 512, MAG, MASKABLE_SCALE)
    # manifest shortcuts 아이콘 (트랙 강조색)
    write_png(os.path.join(ASSETS, 'shortcut-sim-96.png'), 96, CYAN)
    write_png(os.path.join(ASSETS, 'shortcut-rpg-96.png'), 96, MAG)
    write_png(os.path.join(ASSETS, 'shortcut-kit-96.png'), 96, YELL)
