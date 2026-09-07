import { supabase } from "../config/supabase.js";
import { mockDatabase } from "./mockData.js";

function statusFor(startAt, endAt) {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (end < now) return "past";
  if (start > now) return "upcoming";
  return "ongoing";
}

export async function listEvents(userId, query = {}) {
  try {
    let queryBuilder = supabase.from("events").select("*");

    if (query.category) {
      queryBuilder = queryBuilder.eq("category", query.category);
    }
    if (query.search) {
      queryBuilder = queryBuilder.ilike("title", `%${query.search}%`);
    }

    const { data, error } = await queryBuilder;
    if (!error && data && data.length > 0) {
      return data.map(ev => ({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        category: ev.category,
        date: ev.event_date,
        venue: ev.venue,
        capacity: ev.capacity,
        rsvps: ev.rsvps_count,
        isBoosted: ev.is_boosted,
        organizer: ev.organizer_name
      }));
    }
  } catch {
    // Fall back to in-memory store
  }

  let list = [...mockDatabase.events];
  if (query.category && query.category !== "All") {
    list = list.filter(e => e.category.toLowerCase() === query.category.toLowerCase());
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    list = list.filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)));
  }
  return list;
}

export async function getEvent(id, userId) {
  try {
    const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        date: data.event_date,
        venue: data.venue,
        capacity: data.capacity,
        rsvps: data.rsvps_count,
        isBoosted: data.is_boosted,
        organizer: data.organizer_name
      };
    }
  } catch {
    // Fall back
  }

  const found = mockDatabase.events.find(e => e.id === id);
  if (!found) throw Object.assign(new Error("Event not found"), { statusCode: 404 });
  return found;
}

export async function createEvent(data, adminId) {
  const newId = `evt_${Date.now()}`;
  const record = {
    id: newId,
    title: data.title,
    description: data.description || "",
    category: data.category || "Workshop",
    venue: data.venue || data.location || "Campus Auditorium",
    event_date: data.date || data.start_at || "TBD",
    capacity: Number(data.capacity) || 100,
    rsvps_count: 0,
    is_boosted: false,
    organizer_name: data.organizer || "CampusPulse",
    organizer_id: adminId
  };

  try {
    const { data: created, error } = await supabase.from("events").insert(record).select().single();
    if (!error && created) {
      return created;
    }
  } catch {
    // Supabase table not yet provisioned
  }

  const fallback = {
    id: newId,
    title: data.title,
    category: data.category || "Workshop",
    date: data.date || "Upcoming",
    time: "2:00 PM",
    venue: data.venue || "Campus Auditorium",
    capacity: Number(data.capacity) || 100,
    rsvps: 0,
    views: 0,
    liveCheckins: 0,
    isBoosted: false,
    organizer: data.organizer || "CampusPulse"
  };
  mockDatabase.events.push(fallback);
  mockDatabase.organizerStats.managedEvents.push(fallback);
  return fallback;
}

export async function registerForEvent(eventId, userId) {
  const ticketId = `TCK-${Date.now().toString().slice(-6)}`;
  const qrToken = `CP-VALID-${eventId}-${userId}-SECURE`;

  try {
    await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: userId,
      student_id: userId,
      ticket_id: ticketId,
      qr_token: qrToken,
      checked_in: false
    });
  } catch {
    // Table not yet provisioned
  }

  const event = mockDatabase.events.find(e => e.id === eventId);
  if (event) {
    event.isRegistered = true;
    event.rsvps = (event.rsvps || 0) + 1;
  }

  return {
    eventId,
    userId,
    ticketId,
    qrToken,
    status: "REGISTERED"
  };
}

export async function unregisterFromEvent(eventId, userId) {
  try {
    await supabase.from("event_registrations").delete().match({ event_id: eventId, user_id: userId });
  } catch {
    // Table not yet provisioned
  }

  const event = mockDatabase.events.find(e => e.id === eventId);
  if (event) {
    event.isRegistered = false;
    event.rsvps = Math.max(0, (event.rsvps || 1) - 1);
  }

  return { eventId, userId, status: "CANCELLED" };
}
