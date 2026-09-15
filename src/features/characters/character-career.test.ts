import { describe, expect, it } from "vitest";

import {
  getCharacterStateAt,
  type CharacterCareerEvent,
  type CharacterCareerOrganization,
} from "./character-career";

const police: CharacterCareerOrganization = {
  id: "police",
  name: "경찰",
  slug: "police",
};
const ems: CharacterCareerOrganization = {
  id: "ems",
  name: "EMS",
  slug: "ems",
};

function createEvent(
  event: Partial<CharacterCareerEvent> &
    Pick<CharacterCareerEvent, "eventDate" | "eventType" | "id" | "sequenceInDay">,
): CharacterCareerEvent {
  return {
    eventAt: null,
    fromOrganization: null,
    fromRole: null,
    note: null,
    seasonDayId: null,
    sourceUrl: null,
    toOrganization: null,
    toRole: null,
    ...event,
  };
}

describe("getCharacterStateAt", () => {
  const events = [
    createEvent({
      eventAt: "2026-09-14T09:00:00.000Z",
      eventDate: "2026-09-14",
      eventType: "join",
      id: "join-police",
      sequenceInDay: 1,
      toOrganization: police,
      toRole: "순경",
    }),
    createEvent({
      eventAt: "2026-09-15T11:30:00.000Z",
      eventDate: "2026-09-15",
      eventType: "promote",
      fromOrganization: police,
      fromRole: "순경",
      id: "promote-corporal",
      sequenceInDay: 1,
      toOrganization: police,
      toRole: "경장",
    }),
    createEvent({
      eventAt: "2026-09-15T13:10:00.000Z",
      eventDate: "2026-09-15",
      eventType: "promote",
      fromOrganization: police,
      fromRole: "경장",
      id: "promote-sergeant",
      sequenceInDay: 2,
      toOrganization: police,
      toRole: "경사",
    }),
  ];

  it("입사 이전에는 활성 소속을 반환하지 않음", () => {
    expect(getCharacterStateAt(events, "2026-09-14T08:59:00.000Z")).toEqual({
      affiliations: [],
      isComplete: true,
    });
  });

  it("입사 후 현재 소속과 직책을 반환함", () => {
    expect(getCharacterStateAt(events, "2026-09-14T09:01:00.000Z")).toMatchObject({
      affiliations: [{ organization: police, role: "순경" }],
      isComplete: true,
    });
  });

  it("같은 날 시간순 승진을 sequence 순서로 적용함", () => {
    expect(getCharacterStateAt(events, "2026-09-15T12:00:00.000Z")).toMatchObject({
      affiliations: [{ organization: police, role: "경장" }],
      isComplete: true,
    });
    expect(getCharacterStateAt(events, "2026-09-15T13:11:00.000Z")).toMatchObject({
      affiliations: [{ organization: police, role: "경사" }],
      isComplete: true,
    });
  });

  it("시간 미상 사건 뒤에는 같은 날의 상태를 확정하지 않음", () => {
    const incompleteEvents = [
      ...events.slice(0, 2),
      createEvent({
        eventDate: "2026-09-15",
        eventType: "promote",
        fromOrganization: police,
        fromRole: "경장",
        id: "unknown-time-promotion",
        sequenceInDay: 2,
        toOrganization: police,
        toRole: "경사",
      }),
      createEvent({
        eventAt: "2026-09-15T14:00:00.000Z",
        eventDate: "2026-09-15",
        eventType: "promote",
        fromOrganization: police,
        fromRole: "경사",
        id: "later-known-promotion",
        sequenceInDay: 3,
        toOrganization: police,
        toRole: "경위",
      }),
    ];

    expect(
      getCharacterStateAt(incompleteEvents, "2026-09-15T14:59:00.000Z"),
    ).toMatchObject({
      affiliations: [{ organization: police, role: "경장" }],
      isComplete: false,
    });
    expect(
      getCharacterStateAt(incompleteEvents, "2026-09-16T00:00:00.000Z"),
    ).toMatchObject({
      affiliations: [{ organization: police, role: "경위" }],
      isComplete: true,
    });
  });

  it("다중 소속에서 한 조직의 변경이 다른 조직을 제거하지 않음", () => {
    const multiAffiliationEvents = [
      events[0],
      createEvent({
        eventAt: "2026-09-14T10:00:00.000Z",
        eventDate: "2026-09-14",
        eventType: "join",
        id: "join-ems",
        sequenceInDay: 2,
        toOrganization: ems,
        toRole: "인턴",
      }),
      createEvent({
        eventAt: "2026-09-14T11:00:00.000Z",
        eventDate: "2026-09-14",
        eventType: "promote",
        fromOrganization: police,
        id: "promote-police",
        sequenceInDay: 3,
        toOrganization: police,
        toRole: "경장",
      }),
    ];

    const state = getCharacterStateAt(
      multiAffiliationEvents,
      "2026-09-14T12:00:00.000Z",
    );

    expect(state).toMatchObject({ isComplete: true });
    expect(state.affiliations).toEqual(
      expect.arrayContaining([
        { organization: ems, role: "인턴" },
        { organization: police, role: "경장" },
      ]),
    );
  });
});
