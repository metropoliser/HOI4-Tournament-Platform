// Format nation tag to display name
export function formatNationName(nationTag: string): string {
  if (!nationTag) return 'Unknown';

  // Split by underscore to get parts
  const parts = nationTag.split('_');

  if (parts.length === 1) {
    // Just a tag like "GER"
    return nationTag;
  }

  // Format: TAG_country_name_ideology
  // Example: GER_german_kaiserreich_neutrality
  const tag = parts[0];
  const ideology = parts[parts.length - 1];
  const nameParts = parts.slice(1, -1);

  // Capitalize each word in the name
  const formattedName = nameParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Capitalize ideology
  const formattedIdeology = ideology.charAt(0).toUpperCase() + ideology.slice(1);

  return `${tag} - ${formattedName} (${formattedIdeology})`;
}

// Example outputs:
// "GER_german_kaiserreich_neutrality" => "GER - German Kaiserreich (Neutrality)"
// "SOV_soviet_union_communism" => "SOV - Soviet Union (Communism)"
// "USA" => "USA"
