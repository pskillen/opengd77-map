# BrandMeisterVerify

## Purpose

On channel, talk group, or RX group list detail, query BrandMeister and compare against local entities with selective apply.

## Usage

```tsx
import BrandMeisterVerify from '../BrandMeisterVerify/BrandMeisterVerify.tsx';
import BrandMeisterTalkGroupVerify from '../BrandMeisterVerify/BrandMeisterTalkGroupVerify.tsx';
import BrandMeisterRxListVerify from '../BrandMeisterVerify/BrandMeisterRxListVerify.tsx';
```

## Behaviour

- **Channel (detail):** fetch by stored device id or callsign; diff frequencies, colour code, location, comment; optional RX group list correction (update current list or create new).
- **Channel (edit):** same verify flow via `editBindings` — patches the form draft and RX group list selector without saving the channel.
- **Talk group:** fetch `/talkgroup/{id}` catalogue name vs local name.
- **RX list:** requires a linked BrandMeister channel; compares static talk group membership.

### RX group list correction

When BrandMeister static talk groups differ from the channel's linked RX list:

1. Shows a per–talk-group diff (DMR ID and timeslot; names are ignored for matching).
2. User can opt in with **Apply RX group list correction**.
3. Choose **Update current list** (shows current RGL name) or **Create new RX group list** (editable name; existing list names shown as hint).
4. Missing talk groups are created by DMR ID only when no local talk group with that ID exists; timeslot mismatches update the list membership.

## Related

- [BrandMeisterSearch](../BrandMeisterSearch/BrandMeisterSearch.md)
- [BrandMeister reference](../../../docs/reference/brandmeister/README.md)
