# 시뮬레이터 사운드 (SFX) — 자산 출처 · 라이선스

## 채택 팩
- **팩명**: Kenney "Interface Sounds" (v1.0)
- **제작/배포**: Kenney (www.kenney.nl)
- **출처 URL**: https://kenney.nl/assets/interface-sounds
- **다운로드 zip**: https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip
- **라이선스**: **Creative Commons Zero (CC0 1.0 / 퍼블릭 도메인)**
  - http://creativecommons.org/publicdomain/zero/1.0/
- **다운로드 일자**: 2026-07-21

### 라이선스 원문 증빙 (팩 동봉 License.txt · kenney.nl 페이지 문구)
> Interface Sounds (1.0)
> Created/distributed by Kenney (www.kenney.nl)
> Creation date: 11-02-2020
> License: (Creative Commons Zero, CC0)
> http://creativecommons.org/publicdomain/zero/1.0/
> This content is free to use in personal, educational and commercial projects.
> Support us by crediting Kenney or www.kenney.nl (this is not mandatory)

kenney.nl 자산 페이지 메타 문구:
> "Download this package for free, CC0 licensed!"
> License — Creative Commons CC0

표기(크레딧)는 **의무 아님(not mandatory)** — 순수 퍼블릭 도메인. 본 프로젝트는 자율 표기로 이 문서를 유지한다.

## 소스
- 원본 팩: `Audio/*.ogg` 100여 개 (Ogg Vorbis). 본 리포에는 팩 전체가 아닌, 아래 선별 11개만 커밋(표시층 전용).
- 무변환(원본 바이트 그대로) · 파일명만 이벤트 의미로 개명.

## 선별 SFX (simulator/v0.5/audio/ · 원본 파일명 → 용도)
| 파일 | 원본(Kenney) | 게임 이벤트 |
|------|--------------|-------------|
| raid_impact.ogg | glitch_003.ogg | 레이드 임팩트(실행/성공 타격) |
| trade_tick.ogg  | tick_002.ogg   | 시장 거래 틱(매수·매도·숏 진입) |
| phase_shift.ogg | switch_001.ogg | 페이즈 전환(7페이즈 진행) |
| card_play.ogg   | click_002.ogg  | 카드 플레이(계획 확정) |
| select.ogg      | select_001.ogg | UI 선택 / 사운드 토글 확인음 |
| deal.ogg        | confirmation_003.ogg | 협상 거래 성사(자원 스왑, docs/17 §2.1) |
| truce.ogg       | toggle_001.ogg | 비공격 약속(truce, docs/17 §2.1) |
| broker.ogg      | bong_001.ogg   | BROKER 중개 성사(docs/17 §2.3) |
| end_sting.ogg   | drop_004.ogg   | 종료 선언 스팅(victoryDeclaration) |
| victory.ogg     | confirmation_004.ogg | 승리(게임 종료 · 당신 승) |
| defeat.ogg      | error_007.ogg  | 패배(게임 종료 · 당신 패) |

총 11개 · 합계 약 75.7KB (250KB 상한 이내). 전량 Ogg Vorbis · CC0.

## 재생 계층
- `index.html` 인라인 `DNSound` 모듈(플레인 스크립트) — 외부 의존 0 · file:// 호환.
- autoplay 정책 준수: 최초 사용자 제스처(pointerdown/keydown/touchstart) 후 언락 · 언락 전/실패 무해(no-op).
- 마스터 토글: top-bar 🔊/🔇 · localStorage 키 `dn_sim_sound`(RPG `dn_rpg_*` 와 키 분리).
- 게임 로직 무변경 — 상태 전이 관찰(표시층 훅)로만 재생.
</content>
</invoke>
