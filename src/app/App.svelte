<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {nip19} from "nostr-tools"
  import {pluck} from "ramda"
  import {seconds, Fetch} from "hurdak"
  import {now} from "paravel"
  import logger from "src/util/logger"
  import {tryFetch, hexToBech32, bech32ToHex} from "src/util/misc"
  import {storage, session, stateKey, relays, getSetting, dufflepud} from "src/engine"
  import * as engine from "src/engine"
  import {loadAppData} from "src/app/state"
  import {themeVariables, appName} from "src/partials/state"
  import Menu from "src/app/Menu.svelte"
  import Routes from "src/app/Routes.svelte"
  import Toast from "src/app/Toast.svelte"
  import Nav from "src/app/Nav.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"
  import {isNil} from "ramda"
  import {onMount} from "svelte"
  import {memoize} from "src/util/misc"
  import About from "src/app/views/About.svelte"
  import Search from "src/app/views/Search.svelte"
  import Bech32Entity from "src/app/views/Bech32Entity.svelte"
  import Calendar from "src/app/views/Calendar.svelte"
  import ChannelCreate from "src/app/views/ChannelCreate.svelte"
  import ChannelsDetail from "src/app/views/ChannelsDetail.svelte"
  import ChannelsList from "src/app/views/ChannelsList.svelte"
  import DataExport from "src/app/views/DataExport.svelte"
  import DataImport from "src/app/views/DataImport.svelte"
  import EventDetail from "src/app/views/EventDetail.svelte"
  import EventEdit from "src/app/views/EventEdit.svelte"
  import EventDelete from "src/app/views/EventDelete.svelte"
  import GroupList from "src/app/views/GroupList.svelte"
  import GroupDetail from "src/app/views/GroupDetail.svelte"
  import GroupCreate from "src/app/views/GroupCreate.svelte"
  import GroupEdit from "src/app/views/GroupEdit.svelte"
  import GroupInfo from "src/app/views/GroupInfo.svelte"
  import GroupRotate from "src/app/views/GroupRotate.svelte"
  import Help from "src/app/views/Help.svelte"
  import Home from "src/app/views/Home.svelte"
  import LabelCreate from "src/app/views/LabelCreate.svelte"
  import ListEdit from "src/app/views/ListEdit.svelte"
  import ListList from "src/app/views/ListList.svelte"
  import ListSelect from "src/app/views/ListSelect.svelte"
  import ListingEdit from "src/app/views/ListingEdit.svelte"
  import ListingDelete from "src/app/views/ListingDelete.svelte"
  import Login from "src/app/views/Login.svelte"
  import LoginBunker from "src/app/views/LoginBunker.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app/views/LoginPrivKey.svelte"
  import LoginPubKey from "src/app/views/LoginPubKey.svelte"
  import Logout from "src/app/views/Logout.svelte"
  import Market from "src/app/views/Market.svelte"
  import NoteCreate from "src/app/views/NoteCreate.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import Notifications from "src/app/views/Notifications.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import PersonInfo from "src/app/views/PersonInfo.svelte"
  import PersonFollows from "src/app/shared/PersonFollows.svelte"
  import PersonFollowers from "src/app/shared/PersonFollowers.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import PersonZap from "src/app/views/PersonZap.svelte"
  import PublishInfo from "src/app/views/PublishInfo.svelte"
  import QRCode from "src/app/views/QRCode.svelte"
  import MediaDetail from "src/app/views/MediaDetail.svelte"
  import RelayBrowse from "src/app/views/RelayBrowse.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import RelayList from "src/app/views/RelayList.svelte"
  import RelayReview from "src/app/views/RelayReview.svelte"
  // import ReportCreate from "src/app/views/ReportCreate.svelte"
  import ThreadDetail from "src/app/views/ThreadDetail.svelte"
  import TopicFeed from "src/app/views/TopicFeed.svelte"
  import UserContent from "src/app/views/UserContent.svelte"
  import UserData from "src/app/views/UserData.svelte"
  import UserKeys from "src/app/views/UserKeys.svelte"
  import UserProfile from "src/app/views/UserProfile.svelte"
  import UserSettings from "src/app/views/UserSettings.svelte"
  import {logUsage} from "src/app/state"
  import {
    router,
    asChannelId,
    asPerson,
    asNaddr,
    asCsv,
    asJson,
    asString,
    asUrlComponent,
    asFilter,
    asNote,
    asRelay,
    asEntity,
  } from "src/app/router"

  // Routes

  router.register("/about", About)
  router.register("/search", Search)
  router.register("/bech32", Bech32Entity)
  router.register("/events", Calendar)

  router.register("/channels", ChannelsList, {
    requireSigner: true,
  })
  router.register("/channels/create", ChannelCreate, {
    requireSigner: true,
  })
  router.register("/channels/requests", ChannelsList, {
    requireSigner: true,
  })
  router.register("/channels/:channelId", ChannelsDetail, {
    requireSigner: true,
    serializers: {
      channelId: asChannelId,
    },
  })

  router.register("/events/:address", EventDetail, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/events/:address/edit", EventEdit, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/events/:address/delete", EventDelete, {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/groups", GroupList)
  router.register("/groups/new", GroupCreate, {
    requireSigner: true,
  })
  router.register("/groups/:address/edit", GroupEdit, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/groups/:address/info", GroupInfo, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/groups/:address/rotate", GroupRotate, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
      addMembers: asCsv("addMembers"),
      removeMembers: asCsv("removeMembers"),
    },
  })
  router.register("/groups/:address/:activeTab", GroupDetail, {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/help/:topic", Help)

  router.register("/lists", ListList)
  router.register("/lists/create", ListEdit)
  router.register("/lists/select", ListSelect, {
    serializers: {
      type: asString("type"),
      value: asString("value"),
    },
  })
  router.register("/lists/:address", ListEdit, {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/login", Login)
  router.register("/login/bunker", LoginBunker)
  router.register("/login/connect", LoginConnect)
  router.register("/login/privkey", LoginPrivKey)
  router.register("/login/pubkey", LoginPubKey)
  router.register("/logout", Logout)

  router.register("/listings", Market)
  router.register("/listings/:address/edit", ListingEdit, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/listings/:address/delete", ListingDelete, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/media/:url", MediaDetail, {
    serializers: {
      url: asUrlComponent("url"),
    },
  })

  router.register("/", Home, {
    serializers: {
      filter: asFilter,
    },
  })
  router.register("/notes", Home, {
    serializers: {
      filter: asFilter,
    },
  })
  router.register("/notes/create", NoteCreate, {
    requireSigner: true,
    serializers: {
      pubkey: asPerson,
      group: asNaddr("group"),
      type: asString("type"),
    },
  })
  router.register("/notes/:entity", NoteDetail, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/label", LabelCreate, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/status", PublishInfo, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/thread", ThreadDetail, {
    serializers: {
      entity: asNote,
    },
  })

  router.register("/notifications", Notifications, {
    requireUser: true,
  })
  router.register("/notifications/:activeTab", Notifications, {
    requireUser: true,
  })

  router.register("/onboarding", Onboarding)

  router.register("/people/list", PersonList, {
    serializers: {
      pubkeys: asCsv("pubkeys"),
    },
  })
  router.register("/people/:entity", PersonDetail, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
      filter: asFilter,
    },
  })
  router.register("/people/:entity/followers", PersonFollowers, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/follows", PersonFollows, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/info", PersonInfo, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/zap", PersonZap, {
    required: ["pubkey"],
    serializers: {
      eid: asNote,
      entity: asPerson,
      lnurl: asString("lnurl"),
      anonymous: asJson("anonymous"),
    },
  })

  router.register("/qrcode/:code", QRCode)

  router.register("/relays/browse", RelayBrowse)
  router.register("/relays/:entity", RelayDetail, {
    serializers: {
      entity: asRelay,
      filter: asFilter,
    },
  })
  router.register("/relays/:entity/review", RelayReview, {
    serializers: {
      entity: asRelay,
    },
  })

  router.register("/settings", UserSettings, {
    requireUser: true,
  })
  router.register("/settings/content", UserContent, {
    requireUser: true,
  })
  router.register("/settings/data", UserData, {
    requireUser: true,
  })
  router.register("/settings/data/export", DataExport, {
    requireUser: true,
  })
  router.register("/settings/data/import", DataImport, {
    requireUser: true,
  })
  router.register("/settings/keys", UserKeys, {
    requireUser: true,
  })
  router.register("/settings/profile", UserProfile, {
    requireUser: true,
  })
  router.register("/settings/relays", RelayList)

  router.register("/topics/:topic", TopicFeed)

  router.register("/:entity", Bech32Entity, {
    serializers: {
      entity: asEntity,
      filter: asFilter,
    },
  })
  router.register("/:entity/*", Bech32Entity, {
    serializers: {
      entity: asEntity,
      filter: asFilter,
    },
  })

  router.init()

  // Globals
  ;(window as any).g = {
    ...engine,
    nip19,
    bech32ToHex,
    hexToBech32,
    logger,
    router,
  }

  // Theme

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${$themeVariables}; background: var(--dark); }`

  // Scroll position

  let scrollY

  const unsubHistory = router.history.subscribe($history => {
    if ($history[0].config.modal) {
      // This is not idempotent, so don't duplicate it
      if (document.body.style.position !== "fixed") {
        scrollY = window.scrollY

        document.body.style.top = `-${scrollY}px`
        document.body.style.position = `fixed`
      }
    } else if (document.body.style.position === "fixed") {
      document.body.setAttribute("style", "")

      if (!isNil(scrollY)) {
        window.scrollTo(0, scrollY)
        scrollY = null
      }
    }
  })

  // Usage logging, router listener

  onMount(() => {
    const unsubPage = router.page.subscribe(
      memoize($page => {
        if ($page) {
          logUsage($page.path)
        }

        window.scrollTo(0, 0)
      }),
    )

    const unsubModal = router.modal.subscribe($modal => {
      if ($modal) {
        logUsage($modal.path)
      }
    })

    const unsubRouter = router.listen()

    return () => {
      unsubPage()
      unsubModal()
      unsubRouter()
      unsubHistory()
    }
  })

  // Protocol handler

  try {
    const handler = navigator.registerProtocolHandler as (
      scheme: string,
      handler: string,
      name: string,
    ) => void

    handler?.("web+nostr", `${location.origin}/%s`, appName)
    handler?.("nostr", `${location.origin}/%s`, appName)
  } catch (e) {
    // pass
  }

  // App data boostrap and relay meta fetching

  storage.ready.then(() => {
    if ($session) {
      loadAppData()
    }

    const interval = setInterval(async () => {
      if (!getSetting("dufflepud_url")) {
        return
      }

      // Find relays with old/missing metadata and refresh them. Only pick a
      // few so we're not asking for too much data at once
      const staleRelays = relays
        .get()
        .filter(r => (r.info?.last_checked || 0) < now() - seconds(7, "day"))
        .slice(0, 20)

      tryFetch(async () => {
        const result = await Fetch.fetchJson(dufflepud("relay/info"), {
          method: "POST",
          body: JSON.stringify({urls: pluck("url", staleRelays)}),
          headers: {
            "Content-Type": "application/json",
          },
        })

        for (const {url, info} of result.data) {
          relays.key(url).merge({...info, url, last_checked: now()})
        }
      })
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })
</script>

{#await storage.ready}
  <!-- pass -->
{:then}
  <div class="text-warm">
    <Routes />
    {#key $stateKey}
      <ForegroundButtons />
      <Nav />
      <Menu />
      <Toast />
    {/key}
  </div>
{/await}
