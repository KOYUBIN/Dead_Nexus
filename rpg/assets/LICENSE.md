# RPG 픽셀 스프라이트 — 자산 출처 · 라이선스

## 채택 팩
- **팩명**: Kenney "1-Bit Pack" (v1.2)
- **제작/배포**: Kenney (www.kenney.nl)
- **출처 URL**: https://kenney.nl/assets/1-bit-pack
- **다운로드 zip**: https://kenney.nl/media/pages/assets/1-bit-pack/aa867a1f37-1677578516/kenney_1-bit-pack.zip
- **라이선스**: **Creative Commons Zero (CC0 1.0 / 퍼블릭 도메인)**
  - http://creativecommons.org/publicdomain/zero/1.0/
- **다운로드 일자**: 2026-07-20

### 라이선스 원문 증빙 (팩 동봉 License.txt · kenney.nl 페이지 문구)
> License: (Creative Commons Zero, CC0)
> http://creativecommons.org/publicdomain/zero/1.0/
> This content is free to use in personal, educational and commercial projects.
> Support us by crediting Kenney or www.kenney.nl (this is not mandatory)

kenney.nl 자산 페이지 메타 문구:
> "Download this package (1078 assets) for free, CC0 licensed!"
> License — Creative Commons CC0

표기(크레딧)는 **의무 아님(not mandatory)** — 순수 퍼블릭 도메인. 본 프로젝트는 자율 표기로 이 문서를 유지한다.

## 소스 스프라이트시트
- `Tilesheet/monochrome-transparent.png` (16px 타일 · 1px 간격 · 49×22 = 1078 타일)
- 본 리포에는 시트 전체가 아닌, 아래 선별 개별 타일 17장만 커밋 (표시층 전용).

## 선별 스프라이트 (rpg/assets/sprites/ · 원본 시트 (col,row) 좌표)
| 파일 | (col,row) | 용도 |
|------|-----------|------|
| px-cipher.png | (26,1) | 플레이어 CIPHER(해커) |
| px-blade.png  | (27,9) | 플레이어 BLADE(검객) |
| px-rigger.png | (28,2) | 플레이어 RIGGER(기술자) |
| px-mole.png   | (26,4) | 플레이어 MOLE(스파이) |
| px-drone.png  | (30,6) | 적 드론류(VANTA/AXIOM/POLICE/CARBON_DRONE) |
| px-guard.png  | (25,1) | 적 경비/보안(SECURITY/OFFICER/GUARD/MEDIC/ANALYST) |
| px-elite.png  | (27,3) | 적 정예/집행관(ELITE/IRONWALL/RIOT_ENFORCER) |
| px-turret.png | (25,0) | 적 터렛/센트리(IRONWALL_TURRET) |
| px-hound.png  | (31,7) | 적 야수(SPLICE_HOUND) |
| px-wisp.png   | (27,8) | 적 정령/유령(MESH_WISP) |
| px-thug.png   | (30,3) | 적 갱(GANG_THUG) |
| px-boss.png   | (34,12)| 네임드 보스(RIVAL/KAI/MARCUS/VERA/NEXUS) |
| px-ice.png    | (37,11)| 정적 ICE 노드(ICE_NODE/SIGNAL_ICE) |
| px-crate.png  | (8,6)  | 엄폐물 — 부분 엄폐(▣) |
| px-barrel.png | (14,7) | 엄폐물 — 완전 엄폐(▩) |
| px-server.png | (11,7) | 오브젝티브 — 서버/단말 |
| px-floor.png  | (2,0)  | 바닥 변주 텍스처(교차 타일) |

총 17장 · 합계 약 2.6KB (500KB 상한 이내). 전량 모노크롬(흰색/투명) — CSS 틴트(진영색 글로우)로 염색.
