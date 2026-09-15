import type { QueryData } from "@supabase/supabase-js";

import {
  type CharacterCareerEvent,
  type CharacterCareerEventType,
  type CharacterCareerOrganization,
} from "@/features/characters/character-career";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function createCharacterCareerEventsQuery(participantId: string) {
  return getSupabaseBrowserClient()
    .from("character_career_events")
    .select(`
      id,
      event_type,
      from_role,
      to_role,
      event_date,
      event_at,
      sequence_in_day,
      season_day_id,
      note,
      source_url,
      from_organization:organizations!character_career_events_from_organization_same_season_fkey (
        id,
        slug,
        name
      ),
      to_organization:organizations!character_career_events_to_organization_same_season_fkey (
        id,
        slug,
        name
      )
    `)
    .eq("participant_id", participantId)
    .order("event_date", { ascending: false })
    .order("sequence_in_day", { ascending: false });
}

type CharacterCareerEventsQueryData = QueryData<
  ReturnType<typeof createCharacterCareerEventsQuery>
>;

export async function getCharacterCareerEvents(
  participantId: string,
): Promise<CharacterCareerEvent[]> {
  const result = await createCharacterCareerEventsQuery(participantId);

  if (result.error) {
    throw new Error("캐릭터 이력을 불러오지 못함.", { cause: result.error });
  }

  return result.data.map(toCharacterCareerEvent);
}

function toCharacterCareerEvent(
  event: CharacterCareerEventsQueryData[number],
): CharacterCareerEvent {
  return {
    eventAt: event.event_at,
    eventDate: event.event_date,
    eventType: toCharacterCareerEventType(event.event_type),
    fromOrganization: toCareerOrganization(event.from_organization),
    fromRole: event.from_role,
    id: event.id,
    note: event.note,
    seasonDayId: event.season_day_id,
    sequenceInDay: event.sequence_in_day,
    sourceUrl: event.source_url,
    toOrganization: toCareerOrganization(event.to_organization),
    toRole: event.to_role,
  };
}

function toCharacterCareerEventType(
  value: string,
): CharacterCareerEventType {
  switch (value) {
    case "appoint":
    case "demote":
    case "join":
    case "leave":
    case "promote":
    case "transfer":
      return value;
    default:
      throw new Error("지원하지 않는 캐릭터 이력 유형임.");
  }
}

function toCareerOrganization(
  organization: CharacterCareerEventsQueryData[number]["from_organization"],
): CharacterCareerOrganization | null {
  if (organization === null) {
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  };
}
