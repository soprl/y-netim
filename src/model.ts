/** Shared persisted model. Browser globals stay classic scripts for save/test compatibility. */
type Regime = 'cum' | 'fed' | 'kra' | 'cun';
type MinisterKey = 'eko' | 'ici' | 'sav' | 'dis';
type GameTab = 'karakter' | 'dunya' | 'bolge' | 'devlet' | 'meclis' | 'tarih';
type MapMode = 'ulke' | 'sad' | 'zen' | 'des';
type OperationKind = 'conquest' | 'amphibious' | 'destabilize' | 'election' | 'independence' | 'alliance' | 'protectorate' | 'fort' | 'relief' | 'garrison';
type StoryKind = 'labor' | 'port' | 'border';
type StoryStatus = 'active' | 'closed';
type PartyPromise = 'jobs' | 'economy' | 'education' | 'rights' | 'security' | 'ecology';
type NumericPersonKey = 'money' | 'health' | 'fame' | 'org' | 'rep' | 'speech' | 'lead' | 'legacy';
interface HistoryEntry { a: number; t: string }
interface Person {
 id: number; name: string; age: number; edu: number; job: string; money: number; ideo: string;
 speech: number; lead: number; rep: number; fame: number; org: number; health: number; r: number;
 pos: string; party: string | null; hist: HistoryEntry[]; alive: boolean; seed: number; cand: string | null;
 independentCountry?:number;independentRegion?:number;mpCountry?:number;lastParliamentTurn?:number; rallyVisits?:Record<string,number>;traits?: TraitId[]; bond?: CharacterBond; lastMeeting?:number; ai?: boolean; jail: number; legacy: number; cool: Record<string, number>; nameCulture?: string; customName?: boolean;
}
interface Region {
 id: number; n: string; c: number; x: number; y: number; pop: number; wealth: number; infra: number;
 edu: number; loyal: number; auto: number; tax: number; bud: number; adm: number; cen: number;
 sup: number; gov: number; mayor: number; unemployment?: number; grievance?: number; fort?: number;
 resistance?: number; occupation?: number; policyTurn?: number; lastSupportTurn?:number; lastReconcileTurn?:number; purchasedBy?:number; purchasedTurn?:number; lastAddressTurn?:number;
}
interface Party {
 closed?:'dissolved'|'banned';closedTurn?:number;
 name: string; candidate: number; color: string; campaign: number; share?: number; seats?: number;
 partyId?: string; members?: number; funds?: number; ideology?: string; manifesto?: string;
 promises?: PartyPromise[]; symbol?: string; userDefined?: boolean; newParty?: boolean;
 founder?: number | null; established?: number; lastFinance?: { dues: number; upkeep: number }; sanctionUntil?:number;
}
interface ElectionResultParty { name: string; share: number; seats: number; candidate: number }
interface ElectionResult { turn: number; parties: ElectionResultParty[] }
interface IndependentCandidacy {person:number;region:number;campaign:number}
interface IndependentSeat {person:number;region:number}
interface ParliamentQuestion {id:number;c:number;author:number;party:string|null;topic:string;turn:number;status:'pending'|'answered'|'refused';answerTurn?:number}
interface ParliamentBloc {leader:number;term:number;supporters:number;transfers:{partyId:string;count:number}[];buyerPartyId?:string}
interface CoalitionDeal {top:number;partner:number;program:string;ministries:MinisterKey[];cost:number;turn:number}
interface Country {
 coalitionDeal?:CoalitionDeal;
 parliamentBloc?:ParliamentBloc;parliamentGovernment?:number;
 puppet?:boolean;lastDirectiveTurn?:number; independentCandidates?:IndependentCandidacy[];independentSeats?:IndependentSeat[];
 id: number; n: string; reg: Regime; col: string; tax: number; T: number; econ: number; stab: number;
 appr: number; army: number; rel: Record<number, number>; allies: number[]; trade: number[]; off: number;
 alive: boolean; cap: number; min: Record<MinisterKey, number>; leader: number; gen: number; opp: number;
 inflation?: number; repression?: number; navy?: number; patron?: number | null; coalition?: number[];
 parties?: Party[]; tension?: number; security?: number; vice?: number | null; incumbentParty?: number;
 electionDue?: number; lastElection?: ElectionResult; pendingCoalition?: { top: number; deadline: number; offer?: number } | null;
 lastBudget?: { income: number; maintenance: number; balance: number }; independentTurn?: number;
}
interface War { a: number; b: number; front: number; t: number }
interface Operation { costPaid?:number; chanceRoll?:number; chancePercent?:number; lastRoll?:number; lastReport?:string; kind: OperationKind; r: number; from: number; c: number; target: number; turn: number; age?: number; progress?: number }
interface Unrest { r: number; age: number; power: number; reason?: string }
interface IndependenceMovement { r: number; parent: number; sponsor: number; age: number; phase: string; support: number; votes: number | null }
interface PressAction { turn: number; c: number; kind: string; title: string; detail: string }
type PolicyKind='education'|'infrastructure';
interface CountryMetrics {econ:number;stab:number;appr:number;treasury:number}
interface PeriodEffect {label:string;changes:Partial<CountryMetrics>;origin?:'decision'|'project'|'world';detail?:string}
interface PeriodBaseline {c:number;turn:number;metrics:CountryMetrics}
interface PolicyProject {id:string;c:number;kind:PolicyKind;started:number;lastTurn:number;progress:number;paid:number;status:'active'|'paused'|'completed'|'cancelled'}
interface StoryChoice { turn: number; title: string; route: string }
interface StoryChain { id: string; c: number; kind: StoryKind; stage: number; started: number; due: number; route: string; status: StoryStatus; awaiting: boolean; summary: string; choices: StoryChoice[] }
interface NewsEdition {
 id: string; turn: number; c: number; date: string; headline: string;
 actions: Pick<PressAction, 'title' | 'detail' | 'kind'>[];
 voices: { name: string; text: string }[]; reports: string[];
 metrics: { econ: number; stab: number; appr: number; treasury: number };
 delta: { econ: number; stab: number; appr: number; treasury?:number };
 causes?:PeriodEffect[];baseline?:CountryMetrics;
 stories: { title: string; stage: number; status: StoryStatus; summary: string }[];
}
interface VoteBars { you: number; riv: number }
interface NightParty { name: string; candidate: string; share: number; seats: number; color: string; current?: number }
interface QueuedEvent {
 id: string; reportId?:string; bondKind?:string; uid?: string; bars?: VoteBars; k?: string; title?: string; text?: string; scene?: string; secret?: boolean;
 pid?: number; r?: number; c?: number; top?: number; partner?: number; chainId?: string;
 victim?: number; name?: string; seed?: number; country?: string; role?: string; saved?: boolean; demo?: boolean;
 turn?: number; total?: number; preview?: boolean; parties?: NightParty[];
}
interface GameState {
 policyProjects?:PolicyProject[];policySequence?:number;periodBaseline?:PeriodBaseline;periodEffects?:PeriodEffect[];
 v: number; version?: string; turn: number; cs: Country[]; rs: Region[]; ps: Person[]; pid: number | null;
 log: { d: string; t: string }[]; q: QueuedEvent[]; ap: number; wars: War[]; sel: number; tab: GameTab;
 mapMode: MapMode; extra: number; unrest: Unrest[]; discoveries: string[]; operations?: Operation[];
 movements?: IndependenceMovement[]; electionHistory?: (ElectionResult & { c: number })[]; cinemaSequence?: number;
 news?: NewsEdition[]; pressActions?: PressAction[]; storyChains?: StoryChain[]; storyCooldowns?: Record<string, number>;
 decisionReports?:DecisionReport[]; reportSequence?:number; actionUsage?:Record<string,{turn:number;count:number}>; lastBondEvent?:number; lastReadNews?: string | null; armedMovements?: ArmedMovement[]; controlCampaigns?: ControlCampaign[]; parliamentQuestions?:ParliamentQuestion[]; parliamentQuestionSequence?:number;
}
interface PartyDraft { name: string; ideology: string; color: string; symbol: string; manifesto: string; promises: PartyPromise[] }
interface NewCharacter { name?: string; age?: number | string; edu?: number; job?: string; ideo?: string; c?: number; r?: number }
interface Sheet {top?:number;partner?:number;t: string; kind?: OperationKind; r?: number; id?: number | string; k?: MinisterKey; cost?: number }
interface Projection { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number }
interface UIState {
 movementFlagDraft?:MovementFlag;view: string; sheet: Sheet | null; flash: string | null; cnew: NewCharacter; pick: string;
 cand?: { name: string; lead: number; seed: number }[]; applyingUpdate?: boolean; cinemaPreview?: QueuedEvent | null;
 electionPreview?: QueuedEvent | null; importError?: string | null; loadError?: string | null; mapCountry?: number | null;
 mapProjection?: Projection | null; notice?: string | null; partyDraft?: PartyDraft | null; partyError?: string | null;
 pendingImport?: GameState | null; saveError?: string | null; tutorial?: number | null; updateReady?: boolean;
}
interface Action { id: string; title: string; desc: string; ap: number; cost: number; cost2?: number; cost3?: number; lock?: string | null; tag?: string; run?: () => void }
interface EventChoice { t: string; n: string; f: (person: Person) => void }
interface EventCard { k: string; t: string; x: (person: Person) => string; cond?: (person: Person) => boolean; c: EventChoice[] }
interface CountryDefinition { n: string; reg: Regime; col: string; rs: [string, number, number][] }
interface RegionLayout { old: number; home: number; x: number; y: number; n: string; parts: number; primary: boolean }
interface Point { x: number; y: number }
interface Bounds { x0: number; x1: number; y0: number; y1: number }
interface RasterGeometry { flags: Uint8Array; bounds: (Bounds | null)[]; sea: Uint8ClampedArray }
interface RasterCache { geometry: RasterGeometry | null; key: string | null; canvas: HTMLCanvasElement | null; builds: number; hits: number }
interface RenderFunction { (): void; tab?: GameTab }
interface WorldOption { title: string; desc: string; cost: number; route: string; apply: () => void }
interface CountryProfile { name: string; accent: string; sky: string; roof: string; music: number[]; weather: string; group: string; code: string; capital: string; flag: string; country: string }
interface Window { webkitAudioContext?: typeof AudioContext; claude?: { hot?: { snapshot?: (fn: () => unknown) => void; ready?: (fn: (data: { g?: GameState; view?: string }) => void) => void; data?: { g?: GameState; view?: string } } } }
interface AmbientOscillator extends OscillatorNode { finished?: boolean }

interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void> }
interface WindowEventMap { beforeinstallprompt: BeforeInstallPromptEvent }
function eventElement<T extends Element = HTMLElement>(event: Event): T {
 if (!(event.target instanceof Element)) throw new Error('Olayın hedef öğesi bulunamadı.');
 return event.target as T;
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function byId<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T; }

interface TimedToast { (): void; t?: number }
function isGameTab(value: string): value is GameTab { return ['karakter','dunya','bolge','devlet','meclis','tarih'].includes(value); }
function isMapMode(value: string): value is MapMode { return ['ulke','sad','zen','des'].includes(value); }
function isMinisterKey(value: string): value is MinisterKey { return ['eko','ici','sav','dis'].includes(value); }

function keysOf<T extends object>(value:T):(keyof T)[]{return Object.keys(value) as (keyof T)[];}

interface MovementFlag {primary:string;secondary:string;pattern:'solid'|'horizontal'|'vertical';symbol:'star'|'circle'|'diamond'}
interface ArmedMovement {flag?:MovementFlag;equipment?:number;supplies?:number;lastEquipmentTurn?:number;lastSuppliesTurn?:number;lastSponsorTurn?:number; id:string; founder:number; name:string; home:number; baseRegion:number; strength:number; support:number; controlled:number[]; country:number|null; active:boolean; started:number }
interface ControlCampaign { lastRoll?:number; lastReport?:string; movement:string; r:number; originalOwner:number; age:number; progress:number }

type TraitId='loyal'|'ambitious'|'pragmatic'|'cautious'|'charismatic'|'idealistic'|'stubborn'|'mediator';
interface CharacterBond {trust:number;respect:number;tension:number}
interface DecisionFactor {label:string;value:string;impact:number}
interface DecisionReport {id:string;turn:number;c:number;category:string;title:string;summary:string;factors:DecisionFactor[];hint:string}
interface BattleAssessment {attack:number;defense:number;base:number;supply:number;fronts:number;factors:DecisionFactor[]}
interface ControlAssessment {power:number;base:number;factors:DecisionFactor[]}
interface PriorityItem {level:'urgent'|'important'|'info';title:string;detail:string;target:string;r?:number}

