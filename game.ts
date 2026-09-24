/* The Lighthouse — a tiny text adventure on a 2x2 grid. */

type Direction = "north" | "south" | "east" | "west";

interface Room {
  name: string;
  /** Two sentences: what the player can see from here. */
  description: string;
  /** Column and row on the 2x2 map. (0,0) is the top left. */
  x: number;
  y: number;
  /** Why a direction cannot be taken, even when a room lies that way. */
  blocked: Partial<Record<Direction, string>>;
}

const STEPS: Record<Direction, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
};

const DIRECTION_ORDER: Direction[] = ["north", "south", "east", "west"];

const KEYS: Record<string, Direction> = {
  ArrowUp: "north",
  ArrowDown: "south",
  ArrowRight: "east",
  ArrowLeft: "west",
};

const ROOMS: Room[] = [
  {
    name: "Spiral Stair",
    description:
      "Iron steps wind up the inside of the tower, slick with salt damp and ringing under your boots. A slit window shows nothing but grey water, and a low door stands open to the east where something is humming.",
    x: 0,
    y: 0,
    blocked: {
      north: "The trapdoor to the roof is padlocked, and the key is not on its nail.",
      west: "The tower wall curves away west without a single door in it.",
    },
  },
  {
    name: "Lamp Room",
    description:
      "The great lens sits at the centre of the room like a glass beehive, sweeping slow bars of light across the panes. Wind leans on the storm glass, and the air is thick with hot brass and paraffin.",
    x: 1,
    y: 0,
    blocked: {
      north: "Beyond the storm panes there is only black water, a long way down.",
      east: "East is the gallery rail and a hundred feet of nothing.",
      south: "There is no hatch in this floor — the rocks are reached by the stair.",
    },
  },
  {
    name: "Keeper's Kitchen",
    description:
      "A cold stove, one chipped mug, and the logbook lying open at yesterday's date. Sand has drifted across the flagstones from the doorway that gives onto the rocks.",
    x: 0,
    y: 1,
    blocked: {
      south: "South is the sea wall, and the tide is up against it.",
      west: "West is two feet of granite, laid to stand against the winter.",
    },
  },
  {
    name: "Rocks",
    description:
      "Black rocks shelve down into the sea, streaming white as each wave drains away. Above you the lighthouse goes up into the mist, its door propped open to the west.",
    x: 1,
    y: 1,
    blocked: {
      north: "The tower wall is sheer here; the lamp room is only reached from inside.",
      east: "East is open sea, and the next wave is already on its way in.",
      south: "The rocks drop off south into deep green water.",
    },
  },
];

const roomAt = (x: number, y: number): Room | undefined =>
  ROOMS.find((room) => room.x === x && room.y === y);

const exitsFrom = (room: Room): { direction: Direction; room: Room }[] => {
  const exits: { direction: Direction; room: Room }[] = [];
  for (const direction of DIRECTION_ORDER) {
    if (room.blocked[direction]) continue;
    const step = STEPS[direction];
    const neighbour = roomAt(room.x + step.dx, room.y + step.dy);
    if (neighbour) exits.push({ direction, room: neighbour });
  }
  return exits;
};

const blockedReason = (room: Room, direction: Direction): string => {
  const reason = room.blocked[direction];
  if (reason) return reason;
  const step = STEPS[direction];
  return roomAt(room.x + step.dx, room.y + step.dy)
    ? ""
    : `There is nothing ${direction} of here but weather.`;
};

const capitalise = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

class Game {
  private current: Room;
  private readonly nameEl: HTMLElement;
  private readonly descriptionEl: HTMLElement;
  private readonly exitListEl: HTMLElement;
  private readonly messageEl: HTMLElement;

  constructor(start: Room, elements: {
    name: HTMLElement;
    description: HTMLElement;
    exitList: HTMLElement;
    message: HTMLElement;
  }) {
    this.current = start;
    this.nameEl = elements.name;
    this.descriptionEl = elements.description;
    this.exitListEl = elements.exitList;
    this.messageEl = elements.message;
  }

  start(): void {
    window.addEventListener("keydown", (event: KeyboardEvent) => {
      const direction = KEYS[event.key];
      if (!direction) return;
      event.preventDefault();
      this.move(direction);
    });
    this.render("");
  }

  private move(direction: Direction): void {
    const exit = exitsFrom(this.current).find((e) => e.direction === direction);
    if (!exit) {
      this.render(blockedReason(this.current, direction));
      return;
    }
    this.current = exit.room;
    this.render("");
  }

  private render(message: string): void {
    this.nameEl.textContent = this.current.name;
    this.descriptionEl.textContent = this.current.description;

    this.exitListEl.textContent = "";
    for (const exit of exitsFrom(this.current)) {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.className = "direction";
      label.textContent = capitalise(exit.direction);
      item.appendChild(label);
      item.appendChild(document.createTextNode(exit.room.name));
      this.exitListEl.appendChild(item);
    }

    this.messageEl.textContent = message || " ";
  }
}

const element = (id: string): HTMLElement => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element: #${id}`);
  return found;
};

const startingRoom = ROOMS.find((room) => room.name === "Rocks");
if (!startingRoom) throw new Error("The Rocks are missing from the map.");

new Game(startingRoom, {
  name: element("room-name"),
  description: element("room-description"),
  exitList: element("exit-list"),
  message: element("message"),
}).start();
