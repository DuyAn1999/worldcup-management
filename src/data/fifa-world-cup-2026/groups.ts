import type { Group } from "@/domain/tournament/types";

export const fifaWorldCup2026Groups = [
  { id: "group-a", name: "Group A", teamIds: ["mexico", "south-africa", "korea-republic", "czechia"] },
  { id: "group-b", name: "Group B", teamIds: ["canada", "bosnia-herzegovina", "qatar", "switzerland"] },
  { id: "group-c", name: "Group C", teamIds: ["brazil", "morocco", "haiti", "scotland"] },
  { id: "group-d", name: "Group D", teamIds: ["usa", "paraguay", "australia", "turkiye"] },
  { id: "group-e", name: "Group E", teamIds: ["germany", "curacao", "cote-divoire", "ecuador"] },
  { id: "group-f", name: "Group F", teamIds: ["netherlands", "japan", "sweden", "tunisia"] },
  { id: "group-g", name: "Group G", teamIds: ["belgium", "egypt", "ir-iran", "new-zealand"] },
  { id: "group-h", name: "Group H", teamIds: ["spain", "cabo-verde", "saudi-arabia", "uruguay"] },
  { id: "group-i", name: "Group I", teamIds: ["france", "senegal", "iraq", "norway"] },
  { id: "group-j", name: "Group J", teamIds: ["argentina", "algeria", "austria", "jordan"] },
  { id: "group-k", name: "Group K", teamIds: ["portugal", "congo-dr", "uzbekistan", "colombia"] },
  { id: "group-l", name: "Group L", teamIds: ["england", "croatia", "ghana", "panama"] },
] as const satisfies readonly Group[];
