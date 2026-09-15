import { getKstDateFromInstant } from "@/features/seasons/season-date";

export type CharacterCareerEventType =
  | "appoint"
  | "demote"
  | "join"
  | "leave"
  | "promote"
  | "transfer";

export interface CharacterCareerOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface CharacterCareerEvent {
  eventAt: string | null;
  eventDate: string;
  eventType: CharacterCareerEventType;
  fromOrganization: CharacterCareerOrganization | null;
  fromRole: string | null;
  id: string;
  note: string | null;
  seasonDayId: string | null;
  sequenceInDay: number;
  sourceUrl: string | null;
  toOrganization: CharacterCareerOrganization | null;
  toRole: string | null;
}

export interface CharacterCareerStateAffiliation {
  organization: CharacterCareerOrganization;
  role: string | null;
}

export interface CharacterCareerState {
  affiliations: CharacterCareerStateAffiliation[];
  isComplete: boolean;
}

export function getCharacterStateAt(
  events: readonly CharacterCareerEvent[],
  targetTime: Date | string,
): CharacterCareerState {
  const targetTimestamp = getTimestamp(targetTime);

  if (targetTimestamp === null) {
    return { affiliations: [], isComplete: false };
  }

  const targetDate = getKstDateFromInstant(new Date(targetTimestamp));
  const affiliations = new Map<string, CharacterCareerStateAffiliation>();
  let isComplete = true;

  const orderedEvents = [...events].sort(compareCareerEvents);

  for (const event of orderedEvents) {
    if (event.eventDate > targetDate) {
      break;
    }

    if (event.eventDate === targetDate) {
      if (event.eventAt === null) {
        isComplete = false;
        break;
      }

      const eventTimestamp = getTimestamp(event.eventAt);

      if (eventTimestamp === null || eventTimestamp > targetTimestamp) {
        break;
      }
    }

    if (!applyCareerEvent(affiliations, event)) {
      isComplete = false;
      break;
    }
  }

  return {
    affiliations: [...affiliations.values()].sort((left, right) =>
      left.organization.name.localeCompare(right.organization.name, "ko-KR"),
    ),
    isComplete,
  };
}

function applyCareerEvent(
  affiliations: Map<string, CharacterCareerStateAffiliation>,
  event: CharacterCareerEvent,
): boolean {
  switch (event.eventType) {
    case "join":
      return addAffiliation(affiliations, event.toOrganization, event.toRole);
    case "leave":
      return removeAffiliation(affiliations, event.fromOrganization);
    case "transfer":
      return transferAffiliation(
        affiliations,
        event.fromOrganization,
        event.toOrganization,
        event.toRole,
      );
    case "demote":
    case "promote":
      return updateAffiliationRole(
        affiliations,
        event.toOrganization ?? event.fromOrganization,
        event.toRole,
      );
    case "appoint":
      return appointAffiliation(
        affiliations,
        event.toOrganization ?? event.fromOrganization,
        event.toRole,
      );
  }
}

function appointAffiliation(
  affiliations: Map<string, CharacterCareerStateAffiliation>,
  organization: CharacterCareerOrganization | null,
  role: string | null,
): boolean {
  if (organization === null) {
    return false;
  }

  if (!affiliations.has(organization.id)) {
    return addAffiliation(affiliations, organization, role);
  }

  return updateAffiliationRole(affiliations, organization, role);
}

function addAffiliation(
  affiliations: Map<string, CharacterCareerStateAffiliation>,
  organization: CharacterCareerOrganization | null,
  role: string | null,
): boolean {
  if (organization === null || affiliations.has(organization.id)) {
    return false;
  }

  affiliations.set(organization.id, { organization, role });
  return true;
}

function removeAffiliation(
  affiliations: Map<string, CharacterCareerStateAffiliation>,
  organization: CharacterCareerOrganization | null,
): boolean {
  if (organization === null || !affiliations.has(organization.id)) {
    return false;
  }

  affiliations.delete(organization.id);
  return true;
}

function transferAffiliation(
  affiliations: Map<string, CharacterCareerStateAffiliation>,
  fromOrganization: CharacterCareerOrganization | null,
  toOrganization: CharacterCareerOrganization | null,
  toRole: string | null,
): boolean {
  if (
    fromOrganization === null ||
    toOrganization === null ||
    !affiliations.has(fromOrganization.id) ||
    affiliations.has(toOrganization.id)
  ) {
    return false;
  }

  affiliations.delete(fromOrganization.id);
  affiliations.set(toOrganization.id, {
    organization: toOrganization,
    role: toRole,
  });
  return true;
}

function updateAffiliationRole(
  affiliations: Map<string, CharacterCareerStateAffiliation>,
  organization: CharacterCareerOrganization | null,
  role: string | null,
): boolean {
  if (organization === null) {
    return false;
  }

  const affiliation = affiliations.get(organization.id);

  if (affiliation === undefined) {
    return false;
  }

  affiliations.set(organization.id, { ...affiliation, role });
  return true;
}

function compareCareerEvents(
  left: CharacterCareerEvent,
  right: CharacterCareerEvent,
): number {
  if (left.eventDate !== right.eventDate) {
    return left.eventDate.localeCompare(right.eventDate);
  }

  return left.sequenceInDay - right.sequenceInDay;
}

function getTimestamp(value: Date | string): number | null {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}
