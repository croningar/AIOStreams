/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import {
  Config,
  Resolution,
  SortBy,
  Quality,
  VisualTag,
  AudioTag,
  Encode,
  ServiceDetail,
  ServiceCredential,
  StreamType,
} from '@aiostreams/types';
import SortableCardList from '../../components/SortableCardList';
import ServiceInput from '../../components/ServiceInput';
import AddonsList from '../../components/AddonsList';
import { Slide, ToastContainer, toast } from 'react-toastify';
import showToast, { toastOptions } from '@/components/Toasts';
import addonPackage from '../../../package.json';
import { formatSize } from '@aiostreams/formatters';
import {
  allowedFormatters,
  allowedLanguages,
  validateConfig,
} from '@aiostreams/config';
import { addonDetails, serviceDetails, Settings } from '@aiostreams/utils';

import Slider from '@/components/Slider';
import CredentialInput from '@/components/CredentialInput';
import CreateableSelect from '@/components/CreateableSelect';
import MultiSelect from '@/components/MutliSelect';

const version = addonPackage.version;

interface Option {
  label: string;
  value: string;
}

const defaultQualities: Quality[] = [
  { 'BluRay REMUX': true },
  { BluRay: true },
  { 'WEB-DL': true },
  { WEBRip: true },
  { HDRip: true },
  { 'HC HD-Rip': true },
  { DVDRip: true },
  { HDTV: true },
  { CAM: true },
  { TS: true },
  { TC: true },
  { SCR: true },
  { Unknown: true },
];

const defaultVisualTags: VisualTag[] = [
  { 'HDR+DV': true },
  { 'HDR10+': true },
  { DV: true },
  { HDR10: true },
  { HDR: true },
  { '10bit': true },
  { '3D': true },
  { IMAX: true },
  { AI: true },
];

const defaultAudioTags: AudioTag[] = [
  { Atmos: true },
  { 'DD+': true },
  { DD: true },
  { 'DTS-HD MA': true },
  { 'DTS-HD': true },
  { DTS: true },
  { TrueHD: true },
  { '5.1': true },
  { '7.1': true },
  { FLAC: true },
  { AAC: true },
];

const defaultEncodes: Encode[] = [
  { AV1: true },
  { HEVC: true },
  { AVC: true },
  { Xvid: true },
  { DivX: true },
  { 'H-OU': true },
  { 'H-SBS': true },
  { Unknown: true },
];

const defaultSortCriteria: SortBy[] = [
  { cached: true, direction: 'desc' },
  { resolution: true },
  { language: true },
  { size: true, direction: 'desc' },
  { streamType: false },
  { visualTag: false },
  { service: false },
  { audioTag: false },
  { encode: false },
  { quality: false },
  { seeders: false, direction: 'desc' },
  { addon: false },
];

const defaultResolutions: Resolution[] = [
  { '2160p': true },
  { '1080p': true },
  { '720p': true },
  { '480p': true },
  { Unknown: true },
];

const defaultServices = serviceDetails.map((service) => ({
  name: service.name,
  id: service.id,
  enabled: false,
  credentials: {},
}));

const defaultStreamTypes: StreamType[] = [
  { usenet: true },
  { debrid: true },
  { unknown: true },
  { p2p: true },
  { live: true },
];

export default function Configure() {
  const [formatterOptions, setFormatterOptions] = useState<string[]>(
    allowedFormatters.filter((f) => f !== 'imposter')
  );
  const [streamTypes, setStreamTypes] =
    useState<StreamType[]>(defaultStreamTypes);
  const [resolutions, setResolutions] =
    useState<Resolution[]>(defaultResolutions);
  const [qualities, setQualities] = useState<Quality[]>(defaultQualities);
  const [visualTags, setVisualTags] = useState<VisualTag[]>(defaultVisualTags);
  const [audioTags, setAudioTags] = useState<AudioTag[]>(defaultAudioTags);
  const [encodes, setEncodes] = useState<Encode[]>(defaultEncodes);
  const [sortCriteria, setSortCriteria] =
    useState<SortBy[]>(defaultSortCriteria);
  const [formatter, setFormatter] = useState<string>();
  const [services, setServices] = useState<Config['services']>(defaultServices);
  const [onlyShowCachedStreams, setOnlyShowCachedStreams] =
    useState<boolean>(false);
  const [prioritisedLanguages, setPrioritisedLanguages] = useState<
    string[] | null
  >(null);
  const [excludedLanguages, setExcludedLanguages] = useState<string[] | null>(
    null
  );
  const [addons, setAddons] = useState<Config['addons']>([]);
  /*
  const [maxSize, setMaxSize] = useState<number | null>(null);
  const [minSize, setMinSize] = useState<number | null>(null);
  */
  const [maxMovieSize, setMaxMovieSize] = useState<number | null>(null);
  const [minMovieSize, setMinMovieSize] = useState<number | null>(null);
  const [maxEpisodeSize, setMaxEpisodeSize] = useState<number | null>(null);
  const [minEpisodeSize, setMinEpisodeSize] = useState<number | null>(null);
  const [addonNameInDescription, setAddonNameInDescription] =
    useState<boolean>(false);
  const [cleanResults, setCleanResults] = useState<boolean>(false);
  const [maxResultsPerResolution, setMaxResultsPerResolution] = useState<
    number | null
  >(null);
  const [excludeFilters, setExcludeFilters] = useState<readonly Option[]>([]);
  const [strictIncludeFilters, setStrictIncludeFilters] = useState<
    readonly Option[]
  >([]);
  /*
  const [prioritiseIncludeFilters, setPrioritiseIncludeFilters] = useState<
    readonly Option[]
  >([]);
  */
  const [mediaFlowEnabled, setMediaFlowEnabled] = useState<boolean>(false);
  const [mediaFlowProxyUrl, setMediaFlowProxyUrl] = useState<string>('');
  const [mediaFlowApiPassword, setMediaFlowApiPassword] = useState<string>('');
  const [mediaFlowPublicIp, setMediaFlowPublicIp] = useState<string>('');
  const [mediaFlowProxiedAddons, setMediaFlowProxiedAddons] = useState<
    string[] | null
  >(null);
  const [mediaFlowProxiedServices, setMediaFlowProxiedServices] = useState<
    string[] | null
  >(null);
  const [disableButtons, setDisableButtons] = useState<boolean>(false);
  const [manualManifestUrl, setManualManifestUrl] = useState<string | null>(
    null
  );

  const getChoosableAddons = () => {
    return addonDetails.map((addon) => addon.id);
  };

  const createConfig = (): Config => {
    return {
      streamTypes,
      resolutions,
      qualities,
      visualTags,
      audioTags,
      encodes,
      sortBy: sortCriteria,
      onlyShowCachedStreams,
      prioritisedLanguages,
      excludedLanguages,
      maxMovieSize,
      minMovieSize,
      maxEpisodeSize,
      minEpisodeSize,
      addonNameInDescription,
      cleanResults,
      maxResultsPerResolution,
      strictIncludeFilters:
        strictIncludeFilters.length > 0
          ? strictIncludeFilters.map((filter) => filter.value)
          : null,
      excludeFilters:
        excludeFilters.length > 0
          ? excludeFilters.map((filter) => filter.value)
          : null,
      formatter: formatter || 'gdrive',
      mediaFlowConfig: {
        mediaFlowEnabled,
        proxyUrl: mediaFlowProxyUrl,
        apiPassword: mediaFlowApiPassword,
        publicIp: mediaFlowPublicIp,
        proxiedAddons: mediaFlowProxiedAddons,
        proxiedServices: mediaFlowProxiedServices,
      },
      addons,
      services,
    };
  };

  const fetchWithTimeout = async (
    url: string,
    options: RequestInit | undefined,
    timeoutMs = 5000
  ) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      console.log('Fetching', url, `with data: ${options?.body}`);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch {
      console.log('Clearing timeout');
      return clearTimeout(timeout);
    }
  };

  const getManifestUrl = async (
    protocol = window.location.protocol,
    root = window.location.host
  ) => {
    const config = createConfig();
    console.log('Config', config);
    setDisableButtons(true);

    try {
      const encryptPath = `/encrypt-user-data`;
      const response = await fetchWithTimeout(encryptPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: JSON.stringify(config) }),
      });
      if (!response) {
        throw new Error('encrypt-user-data failed: no response within timeout');
      }

      if (!response.ok) {
        throw new Error(
          `encrypt-user-data failed with status ${response.status} and statusText ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        if (data.error) {
          return {
            success: false,
            manifest: null,
            message: data.error,
          };
        }
        throw new Error(`Encryption service failed, ${data.message}`);
      }

      const encryptedConfig = data.data;
      return {
        success: true,
        manifest: `${protocol}//${root}/${encryptedConfig}/manifest.json`,
      };
    } catch (error: any) {
      console.error(
        'Error during encryption:',
        error.message,
        '\nFalling back to base64 encoding'
      );
      try {
        const base64Config = btoa(JSON.stringify(config));
        return {
          success: true,
          manifest: `${protocol}//${root}/${base64Config}/manifest.json`,
        };
      } catch (base64Error: any) {
        console.error('Error during base64 encoding:', base64Error.message);
        return {
          success: false,
          manifest: null,
          message: 'Failed to encode config',
        };
      }
    }
  };

  const createAndValidateConfig = () => {
    const config = createConfig();

    const { valid, errorCode, errorMessage } = validateConfig(config);
    console.log('Config', config, 'was valid:', valid);
    if (!valid) {
      showToast(
        errorMessage || 'Invalid config',
        'error',
        errorCode || 'error'
      );
      return false;
    }
    return true;
  };

  const handleInstall = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (createAndValidateConfig()) {
      const id = toast.loading('Generating manifest URL...', {
        ...toastOptions,
        toastId: 'generatingManifestUrl',
      });
      const manifestUrl = await getManifestUrl();
      if (!manifestUrl.success || !manifestUrl.manifest) {
        setDisableButtons(false);
        toast.update(id, {
          render: manifestUrl.message || 'Failed to generate manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        return;
      }

      const stremioUrl = manifestUrl.manifest.replace(/^https?/, 'stremio');

      try {
        const wp = window.open(stremioUrl, '_blank');
        if (!wp) {
          throw new Error('Failed to open window');
        }
        toast.update(id, {
          render: 'Successfully generated manifest URL',
          type: 'success',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(null);
      } catch (error) {
        console.error('Failed to open Stremio', error);
        toast.update(id, {
          render:
            'Failed to open Stremio with manifest URL. The link can be opened manually at the bottom of this page.',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(stremioUrl);
      }
      setDisableButtons(false);
    }
  };

  const handleInstallToWeb = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (createAndValidateConfig()) {
      const id = toast.loading('Generating manifest URL...', toastOptions);
      const manifestUrl = await getManifestUrl();
      if (!manifestUrl.success || !manifestUrl.manifest) {
        toast.update(id, {
          render: manifestUrl.message || 'Failed to generate manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setDisableButtons(false);
        return;
      }

      const encodedManifestUrl = encodeURIComponent(manifestUrl.manifest);

      try {
        const wp = window.open(
          `https://web.stremio.com/#/addons?addon=${encodedManifestUrl}`,
          '_blank'
        );
        if (!wp) {
          throw new Error('Failed to open window');
        }
        toast.update(id, {
          render: 'Successfully generated manifest URL and opened Stremio web',
          type: 'success',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(null);
      } catch (error) {
        console.error('Failed to open Stremio web', error);
        toast.update(id, {
          render:
            'Failed to open Stremio web with manifest URL. The link can be opened manually at the bottom of this page.',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(
          `https://web.stremio.com/#/addons?addon=${encodedManifestUrl}`
        );
      }
      setDisableButtons(false);
    }
  };

  const handleCopyLink = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (createAndValidateConfig()) {
      const id = toast.loading('Generating manifest URL...', toastOptions);
      const manifestUrl = await getManifestUrl();
      if (!manifestUrl.success || !manifestUrl.manifest) {
        toast.update(id, {
          render: manifestUrl.message || 'Failed to generate manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setDisableButtons(false);
        return;
      }
      if (!navigator.clipboard) {
        toast.update(id, {
          render:
            'Clipboard not available. The link can be copied manually at the bottom of this page.',
          type: 'error',
          autoClose: 3000,
          isLoading: false,
        });
        setManualManifestUrl(manifestUrl.manifest);
        setDisableButtons(false);
        return;
      }
      navigator.clipboard
        .writeText(manifestUrl.manifest)
        .then(() => {
          toast.update(id, {
            render: 'Manifest URL copied to clipboard',
            type: 'success',
            autoClose: 5000,
            toastId: 'copiedManifestUrl',
            isLoading: false,
          });
          setManualManifestUrl(null);
        })
        .catch((err: any) => {
          console.error('Failed to copy manifest URL to clipboard', err);
          toast.update(id, {
            render:
              'Failed to copy manifest URL to clipboard. The link can be copied manually at the bottom of this page.',
            type: 'error',
            autoClose: 3000,
            isLoading: false,
          });
          setManualManifestUrl(manifestUrl.manifest);
        });
      setDisableButtons(false);
    }
  };

  const loadValidValuesFromObject = (
    object: { [key: string]: boolean }[] | undefined,
    validValues: { [key: string]: boolean }[]
  ) => {
    if (!object) {
      return validValues;
    }

    const mergedValues = object.filter((value) =>
      validValues.some((validValue) =>
        Object.keys(validValue).includes(Object.keys(value)[0])
      )
    );

    for (const validValue of validValues) {
      if (
        !mergedValues.some(
          (value) => Object.keys(value)[0] === Object.keys(validValue)[0]
        )
      ) {
        mergedValues.push(validValue);
      }
    }

    return mergedValues;
  };

  const loadValidSortCriteria = (sortCriteria: Config['sortBy']) => {
    if (!sortCriteria) {
      return defaultSortCriteria;
    }

    const mergedValues = sortCriteria
      .map((sort) => {
        const defaultSort = defaultSortCriteria.find(
          (defaultSort) => Object.keys(defaultSort)[0] === Object.keys(sort)[0]
        );
        if (!defaultSort) {
          return null;
        }
        return {
          ...sort,
          direction: defaultSort?.direction // only load direction if it exists in the defaultSort
            ? sort.direction || defaultSort.direction
            : undefined,
        };
      })
      .filter((sort) => sort !== null);

    defaultSortCriteria.forEach((defaultSort) => {
      if (
        !mergedValues.some(
          (sort) => Object.keys(sort)[0] === Object.keys(defaultSort)[0]
        )
      ) {
        mergedValues.push({
          ...defaultSort,
          direction: defaultSort.direction || undefined,
        });
      }
    });

    return mergedValues;
  };

  const validateValue = (value: string | null, validValues: string[]) => {
    if (!value) {
      return null;
    }
    return validValues.includes(value) ? value : null;
  };

  const loadValidServices = (services: Config['services']) => {
    if (!services) {
      return defaultServices;
    }

    const mergedServices = services
      // filter out services that are not in serviceDetails
      .filter((service) => defaultServices.some((ds) => ds.id === service.id))
      .map((service) => {
        const defaultService = defaultServices.find(
          (ds) => ds.id === service.id
        );
        if (!defaultService) {
          return null;
        }

        // only load enabled and credentials from the previous config
        return {
          ...defaultService,
          enabled: service.enabled,
          credentials: service.credentials,
        };
      })
      .filter((service) => service !== null);

    // add any services that are in defaultServices but not in services
    defaultServices.forEach((defaultService) => {
      if (!mergedServices.some((service) => service.id === defaultService.id)) {
        mergedServices.push(defaultService);
      }
    });

    return mergedServices;
  };

  const loadValidAddons = (addons: Config['addons']) => {
    if (!addons) {
      return [];
    }
    return addons.filter((addon) =>
      addonDetails.some((detail) => detail.id === addon.id)
    );
  };

  // Load config from the window path if it exists
  useEffect(() => {
    async function decodeConfig(config: string) {
      let decodedConfig: Config;
      if (config.startsWith('E-')) {
        throw new Error('Encrypted Config Not Supported');
      } else {
        decodedConfig = JSON.parse(atob(config));
      }
      return decodedConfig;
    }

    function loadFromConfig(decodedConfig: Config) {
      console.log('Loaded config', decodedConfig);
      setStreamTypes(
        loadValidValuesFromObject(decodedConfig.streamTypes, defaultStreamTypes)
      );
      setResolutions(
        loadValidValuesFromObject(decodedConfig.resolutions, defaultResolutions)
      );
      setQualities(
        loadValidValuesFromObject(decodedConfig.qualities, defaultQualities)
      );
      setVisualTags(
        loadValidValuesFromObject(decodedConfig.visualTags, defaultVisualTags)
      );
      setAudioTags(
        loadValidValuesFromObject(decodedConfig.audioTags, defaultAudioTags)
      );
      setEncodes(
        loadValidValuesFromObject(decodedConfig.encodes, defaultEncodes)
      );
      setSortCriteria(loadValidSortCriteria(decodedConfig.sortBy));
      setOnlyShowCachedStreams(decodedConfig.onlyShowCachedStreams || false);
      // create an array for prioritised languages. if the old prioritiseLanguage is set, add it to the array
      const finalPrioritisedLanguages =
        decodedConfig.prioritisedLanguages || [];
      if (decodedConfig.prioritiseLanguage) {
        finalPrioritisedLanguages.push(decodedConfig.prioritiseLanguage);
      }
      setPrioritisedLanguages(
        finalPrioritisedLanguages.filter((lang) =>
          allowedLanguages.includes(lang)
        ) || null
      );
      setExcludedLanguages(
        decodedConfig.excludedLanguages?.filter((lang) =>
          allowedLanguages.includes(lang)
        ) || null
      );
      setStrictIncludeFilters(
        decodedConfig.strictIncludeFilters?.map((filter) => ({
          label: filter,
          value: filter,
        })) || []
      );
      setExcludeFilters(
        decodedConfig.excludeFilters?.map((filter) => ({
          label: filter,
          value: filter,
        })) || []
      );
      setFormatter(
        validateValue(decodedConfig.formatter, allowedFormatters) || 'gdrive'
      );
      setServices(loadValidServices(decodedConfig.services));
      setMaxMovieSize(
        decodedConfig.maxMovieSize || decodedConfig.maxSize || null
      );
      setMinMovieSize(
        decodedConfig.minMovieSize || decodedConfig.minSize || null
      );
      setMaxEpisodeSize(
        decodedConfig.maxEpisodeSize || decodedConfig.maxSize || null
      );
      setMinEpisodeSize(
        decodedConfig.minEpisodeSize || decodedConfig.minSize || null
      );
      setAddons(loadValidAddons(decodedConfig.addons));
      setAddonNameInDescription(decodedConfig.addonNameInDescription || false);
      setCleanResults(decodedConfig.cleanResults || false);
      setMaxResultsPerResolution(decodedConfig.maxResultsPerResolution || null);
      setMediaFlowEnabled(
        decodedConfig.mediaFlowConfig?.mediaFlowEnabled || false
      );
      setMediaFlowProxyUrl(decodedConfig.mediaFlowConfig?.proxyUrl || '');
      setMediaFlowApiPassword(decodedConfig.mediaFlowConfig?.apiPassword || '');
      setMediaFlowPublicIp(decodedConfig.mediaFlowConfig?.publicIp || '');
      setMediaFlowProxiedAddons(
        decodedConfig.mediaFlowConfig?.proxiedAddons || null
      );
      setMediaFlowProxiedServices(
        decodedConfig.mediaFlowConfig?.proxiedServices || null
      );
    }

    const path = window.location.pathname;
    try {
      const configMatch = path.match(/\/([^/]+)\/configure/);

      if (configMatch) {
        const config = configMatch[1];
        decodeConfig(config).then(loadFromConfig);
      }
    } catch (error) {
      console.error('Failed to load config', error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <button
          className={styles.supportMeButton}
          onClick={() => {
            window.open(
              'https://github.com/sponsors/Viren070',
              '_blank',
              'noopener noreferrer'
            );
          }}
        >
          <svg
            fill="#b30000"
            height="24px"
            width="24px"
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 490 490"
            xmlSpace="preserve"
            stroke="#b30000"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {' '}
              <path
                id="XMLID_25_"
                d="M316.554,108.336c4.553,6.922,2.629,16.223-4.296,20.774c-3.44,2.261-6.677,4.928-9.621,7.929 c-2.938,2.995-6.825,4.497-10.715,4.497c-3.791,0-7.585-1.427-10.506-4.291c-5.917-5.801-6.009-15.298-0.207-21.212 c4.439-4.524,9.338-8.559,14.562-11.992C302.698,99.491,312.002,101.414,316.554,108.336z M447.022,285.869 c-1.506,1.536-148.839,151.704-148.839,151.704C283.994,452.035,265.106,460,245,460s-38.994-7.965-53.183-22.427L42.978,285.869 c-57.304-58.406-57.304-153.441,0-211.847C70.83,45.634,107.882,30,147.31,30c36.369,0,70.72,13.304,97.69,37.648 C271.971,43.304,306.32,30,342.689,30c39.428,0,76.481,15.634,104.332,44.021C504.326,132.428,504.326,227.463,447.022,285.869z M425.596,95.028C403.434,72.44,373.991,60,342.69,60c-31.301,0-60.745,12.439-82.906,35.027c-1.122,1.144-2.129,2.533-3.538,3.777 c-7.536,6.654-16.372,6.32-22.491,0c-1.308-1.352-2.416-2.633-3.538-3.777C208.055,72.44,178.612,60,147.31,60 c-31.301,0-60.744,12.439-82.906,35.027c-45.94,46.824-45.94,123.012,0,169.836c1.367,1.393,148.839,151.704,148.839,151.704 C221.742,425.229,233.02,430,245,430c11.98,0,23.258-4.771,31.757-13.433l148.839-151.703l0,0 C471.535,218.04,471.535,141.852,425.596,95.028z M404.169,116.034c-8.975-9.148-19.475-16.045-31.208-20.499 c-7.746-2.939-16.413,0.953-19.355,8.698c-2.942,7.744,0.953,16.407,8.701,19.348c7.645,2.902,14.521,7.431,20.436,13.459 c23.211,23.658,23.211,62.153,0,85.811l-52.648,53.661c-5.803,5.915-5.711,15.412,0.206,21.212 c2.921,2.863,6.714,4.291,10.506,4.291c3.889,0,7.776-1.502,10.714-4.497l52.648-53.661 C438.744,208.616,438.744,151.275,404.169,116.034z"
              ></path>{' '}
            </g>
          </svg>
          Donate
        </button>
        <div className={styles.header}>
          <Image
            src="/assets/logo.png"
            alt="AIOStreams Logo"
            width={200}
            height={200}
            style={{ display: 'block', margin: '0 auto' }}
          />
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <h1 style={{ textAlign: 'center' }}>AIOStreams</h1>
            <span
              className={styles.version}
              title={`See what's new in v${version}`}
              onClick={() => {
                window.open(
                  `https://github.com/Viren070/AIOStreams/releases/tag/v${version}`,
                  '_blank',
                  'noopener noreferrer'
                );
              }}
            >
              v{version}
            </span>
          </div>
          {process.env.NEXT_PUBLIC_BRANDING && (
            <div
              className={styles.branding}
              dangerouslySetInnerHTML={{
                __html: process.env.NEXT_PUBLIC_BRANDING || '',
              }}
            />
          )}
          <p style={{ textAlign: 'center', padding: '15px' }}>
            AIOStreams, the all-in-one streaming addon for Stremio. Combine your
            streams from all your addons into one and filter them by resolution,
            quality, visual tags and more.
            <br />
            <br />
            This addon will return any result from the addons you enable. These
            can be P2P results, direct links, or anything else. Results that are
            P2P are marked as P2P, however.
            <br />
            <br />
            This addon also has no persistence. Nothing you enter here is
            stored. They are encrypted within the manifest URL and are only used
            to retrieve streams from any addons you enable.
          </p>
          <p style={{ textAlign: 'center', padding: '15px' }}>
            <a
              href="https://guides.viren070.me/stremio/addons/aiostreams"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'underline' }}
            >
              Configuration Guide
            </a>
            {' | '}
            <a
              href="https://github.com/Viren070/AIOStreams"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'underline' }}
            >
              GitHub
            </a>

            {' | '}
            <a
              href="https://guides.viren070.me/stremio"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'underline' }}
            >
              Stremio Guide
            </a>
          </p>
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Services</h2>
          <p style={{ padding: '5px' }}>
            Enable the services you have accounts with and enter your
            credentials.
          </p>
          {services.map((service, index) => (
            <ServiceInput
              key={service.id}
              serviceName={service.name}
              enabled={service.enabled}
              setEnabled={(enabled) => {
                const newServices = [...services];
                const serviceIndex = newServices.findIndex(
                  (s) => s.id === service.id
                );
                newServices[serviceIndex] = { ...service, enabled };
                setServices(newServices);
              }}
              fields={
                serviceDetails
                  .find((detail: ServiceDetail) => detail.id === service.id)
                  ?.credentials.map((credential: ServiceCredential) => ({
                    label: credential.label,
                    link: credential.link,
                    value: service.credentials[credential.id] || '',
                    setValue: (value) => {
                      const newServices = [...services];
                      const serviceIndex = newServices.findIndex(
                        (s) => s.id === service.id
                      );
                      newServices[serviceIndex] = {
                        ...service,
                        credentials: {
                          ...service.credentials,
                          [credential.id]: value,
                        },
                      };
                      setServices(newServices);
                    },
                  })) || []
              }
              moveService={(direction) => {
                const newServices = [...services];
                const serviceIndex = newServices.findIndex(
                  (s) => s.id === service.id
                );
                const [movedService] = newServices.splice(serviceIndex, 1);
                if (direction === 'up' && serviceIndex > 0) {
                  newServices.splice(serviceIndex - 1, 0, movedService);
                } else if (
                  direction === 'down' &&
                  serviceIndex < newServices.length
                ) {
                  newServices.splice(serviceIndex + 1, 0, movedService);
                }
                setServices(newServices);
              }}
              canMoveUp={index > 0}
              canMoveDown={index < services.length - 1}
              signUpLink={
                serviceDetails.find((detail) => detail.id === service.id)
                  ?.signUpLink
              }
            />
          ))}

          <div
            className={styles.section}
            style={{ marginTop: '20px', marginBottom: '0px' }}
          >
            <div className={styles.setting}>
              <div className={styles.settingDescription}>
                <h2 style={{ padding: '5px' }}>Only Show Cached Streams</h2>
                <p style={{ padding: '5px' }}>
                  Only show streams that are cached by the enabled services.
                </p>
              </div>
              <div className={styles.settingInput}>
                <input
                  type="checkbox"
                  checked={onlyShowCachedStreams}
                  onChange={(e) => setOnlyShowCachedStreams(e.target.checked)}
                  // move to the right
                  style={{
                    marginLeft: 'auto',
                    marginRight: '20px',
                    width: '25px',
                    height: '25px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Addons</h2>
          <AddonsList
            choosableAddons={getChoosableAddons()}
            addonDetails={addonDetails}
            addons={addons}
            setAddons={setAddons}
          />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Stream Types</h2>
          <p style={{ padding: '5px' }}>
            Choose which stream types you want to see and reorder their priority
            if needed. You can uncheck P2P to remove P2P streams from the
            results.
          </p>
          <SortableCardList items={streamTypes} setItems={setStreamTypes} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Resolutions</h2>
          <p style={{ padding: '5px' }}>
            Choose which resolutions you want to see and reorder their priority
            if needed.
          </p>
          <SortableCardList items={resolutions} setItems={setResolutions} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Qualities</h2>
          <p style={{ padding: '5px' }}>
            Choose which qualities you want to see and reorder their priority if
            needed.
          </p>
          <SortableCardList items={qualities} setItems={setQualities} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Visual Tags</h2>
          <p style={{ padding: '5px' }}>
            Choose which visual tags you want to see and reorder their priority
            if needed.
          </p>
          <SortableCardList items={visualTags} setItems={setVisualTags} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Audio Tags</h2>
          <p style={{ padding: '5px' }}>
            Choose which audio tags you want to see and reorder their priority
            if needed.
          </p>
          <SortableCardList items={audioTags} setItems={setAudioTags} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Encodes</h2>
          <p style={{ padding: '5px' }}>
            Choose which encodes you want to see and reorder their priority if
            needed.
          </p>
          <SortableCardList items={encodes} setItems={setEncodes} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Sort By</h2>
          <p style={{ padding: '5px' }}>
            Choose the criteria by which to sort streams.
          </p>
          <SortableCardList items={sortCriteria} setItems={setSortCriteria} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px', margin: '0px ' }}>Languages</h2>
          <p style={{ margin: '5px 0 12px 5px' }}>
            Choose which languages you want to prioritise and exclude from the
            results
          </p>
          <div className={styles.section}>
            <div>
              <h3 style={{ margin: '2px 0 2px 0' }}>Prioritise Languages</h3>
              <p style={{ margin: '10px 0 10px 0' }}>
                Any results that are detected to have one of the prioritised
                languages will be sorted according to your sort criteria. You
                must have the <code>Langage</code> sort criteria enabled for
                this to work. If there are multiple results with a different
                prioritised language, the order is determined by the order of
                the prioritised languages.
              </p>
            </div>
            <div>
              <MultiSelect
                options={allowedLanguages
                  .sort((a, b) => a.localeCompare(b))
                  .map((language) => ({ value: language, label: language }))}
                setValues={setPrioritisedLanguages}
                values={prioritisedLanguages || []}
              />
            </div>
          </div>
          <div style={{ marginBottom: '0px' }} className={styles.section}>
            <div>
              <h3 style={{ margin: '2px 0 2px 0' }}>Exclude Languages</h3>
              <p style={{ margin: '10px 0 10px 0' }}>
                Any results that are detected to have an excluded language will
                be removed from the results. A result will only be excluded if
                it only has one of or more of the excluded languages. If it
                contains a language that is not excluded, it will still be
                included.
              </p>
            </div>
            <div>
              <MultiSelect
                options={allowedLanguages
                  .sort((a, b) => a.localeCompare(b))
                  .map((language) => ({ value: language, label: language }))}
                setValues={setExcludedLanguages}
                values={excludedLanguages || []}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div>
            <div>
              <h2 style={{ padding: '5px', margin: '0px ' }}>Keyword Filter</h2>
              <p style={{ margin: '5px 0 12px 5px' }}>
                Filter streams by keywords. You can exclude streams that contain
                specific keywords or only include streams that contain specific
                keywords.
              </p>
            </div>
            <div style={{ marginBottom: '0px' }}>
              <div className={styles.section}>
                <h3 style={{ margin: '2px 0 2px 0' }}>Exclude Filter</h3>
                <p style={{ margin: '10px 0 10px 0' }}>
                  Enter keywords to filter streams by. Streams that contain any
                  of the keywords will be excluded.
                </p>
                <CreateableSelect
                  value={excludeFilters}
                  setValue={setExcludeFilters}
                />
              </div>
              <div className={styles.section} style={{ marginBottom: '0px' }}>
                <h3 style={{ margin: '2px 0 2px 0' }}>Include Filter</h3>
                <p style={{ margin: '10px 0 10px 0' }}>
                  Enter keywords to filter streams by. Streams that do not
                  contain any of the keywords will be excluded.
                </p>
                <CreateableSelect
                  value={strictIncludeFilters}
                  setValue={setStrictIncludeFilters}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.slidersSetting}>
            <div>
              <h2 style={{ padding: '5px' }}>Size Filter</h2>
              <p style={{ padding: '5px' }}>
                Filter streams by size. Leave the maximum and minimum size
                sliders at opposite ends to disable the filter.
              </p>
            </div>
            <div className={styles.slidersContainer}>
              <Slider
                maxValue={Settings.MAX_MOVIE_SIZE}
                value={minMovieSize || 0}
                setValue={setMinMovieSize}
                defaultValue="min"
                id="minMovieSizeSlider"
              />
              <div className={styles.sliderValue}>
                Minimum movie size: {formatSize(minMovieSize || 0)}
              </div>
              <Slider
                maxValue={Settings.MAX_MOVIE_SIZE}
                value={
                  maxMovieSize === null ? Settings.MAX_MOVIE_SIZE : maxMovieSize
                }
                setValue={setMaxMovieSize}
                defaultValue="max"
                id="maxMovieSizeSlider"
              />
              <div className={styles.sliderValue}>
                Maximum movie size:{' '}
                {maxMovieSize === null ? 'Unlimited' : formatSize(maxMovieSize)}
              </div>
              <Slider
                maxValue={Settings.MAX_EPISODE_SIZE}
                value={minEpisodeSize || 0}
                setValue={setMinEpisodeSize}
                defaultValue="min"
                id="minEpisodeSizeSlider"
              />
              <div className={styles.sliderValue}>
                Minimum episode size: {formatSize(minEpisodeSize || 0)}
              </div>
              <Slider
                maxValue={Settings.MAX_EPISODE_SIZE}
                value={
                  maxEpisodeSize === null
                    ? Settings.MAX_EPISODE_SIZE
                    : maxEpisodeSize
                }
                setValue={setMaxEpisodeSize}
                defaultValue="max"
                id="maxEpisodeSizeSlider"
              />
              <div className={styles.sliderValue}>
                Maximum episode size:{' '}
                {maxEpisodeSize === null
                  ? 'Unlimited'
                  : formatSize(maxEpisodeSize)}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Limit results per resolution</h2>
              <p style={{ padding: '5px' }}>
                Limit the number of results per resolution. Leave empty to show
                all results.
              </p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="number"
                value={maxResultsPerResolution || ''}
                onChange={(e) =>
                  setMaxResultsPerResolution(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                style={{
                  width: '100px',
                  height: '30px',
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Formatter</h2>
              <p style={{ padding: '5px' }}>
                Change how your stream results are f
                <span
                  onClick={() => {
                    if (formatterOptions.includes('imposter')) {
                      return;
                    }
                    showToast(
                      "What's this doing here....?",
                      'info',
                      'ImposterFormatter'
                    );
                    setFormatterOptions([...formatterOptions, 'imposter']);
                  }}
                >
                  ◌
                </span>
                rmatted.
              </p>
            </div>
            <div className={styles.settingInput}>
              <select
                value={formatter}
                onChange={(e) => setFormatter(e.target.value)}
              >
                {formatterOptions.map((formatter) => (
                  <option key={formatter} value={formatter}>
                    {formatter}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Move Addon Name to Description</h2>
              <p style={{ padding: '5px' }}>
                Move the addon name to the description of the stream. This will
                show <code>AIOStreams</code> as the stream title, but move the
                name of the addon that the stream is from to the description.
                This is useful for Vidi users.
              </p>
            </div>
            <div className={styles.checkboxSettingInput}>
              <input
                type="checkbox"
                checked={addonNameInDescription}
                onChange={(e) => setAddonNameInDescription(e.target.checked)}
                // move to the right
                style={{
                  marginLeft: 'auto',
                  marginRight: '20px',
                  width: '25px',
                  height: '25px',
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.ettingDescription}>
              <h2 style={{ padding: '5px' }}>Clean Results</h2>
              <p style={{ padding: '5px' }}>
                Attempt to remove duplicate results. For a given file with
                duplicate streams: one uncached stream from all uncached streams
                is selected per provider. One cached stream from only one
                provider is selected. For duplicates without a provider, one
                stream is selected at random.
              </p>
            </div>
            <div className={styles.checkboxSettingInput}>
              <input
                type="checkbox"
                checked={cleanResults}
                onChange={(e) => setCleanResults(e.target.checked)}
                // move to the right
                style={{
                  marginLeft: 'auto',
                  marginRight: '20px',
                  width: '25px',
                  height: '25px',
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>MediaFlow</h2>
              <p style={{ padding: '5px' }}>
                Use MediaFlow to proxy your streams
              </p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="checkbox"
                checked={mediaFlowEnabled}
                onChange={(e) => {
                  setMediaFlowEnabled(e.target.checked);
                }}
                style={{
                  width: '25px',
                  height: '25px',
                }}
              />
            </div>
          </div>
          {
            <div
              className={`${styles.mediaFlowConfig} ${mediaFlowEnabled ? '' : styles.hidden}`}
            >
              <div className={styles.mediaFlowSection}>
                <div>
                  <div>
                    <h3 style={{ padding: '5px' }}>Proxy URL</h3>
                    <p style={{ padding: '5px' }}>
                      The URL of the MediaFlow proxy server
                    </p>
                  </div>
                  <div>
                    <CredentialInput
                      credential={mediaFlowProxyUrl}
                      setCredential={setMediaFlowProxyUrl}
                      inputProps={{
                        placeholder: 'Enter your MediaFlow proxy URL',
                        disabled: !mediaFlowEnabled,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <h3 style={{ padding: '5px' }}>API Password</h3>
                    <p style={{ padding: '5px' }}>
                      Your MediaFlow&apos;s API password
                    </p>
                  </div>
                  <div>
                    <CredentialInput
                      credential={mediaFlowApiPassword}
                      setCredential={setMediaFlowApiPassword}
                      inputProps={{
                        placeholder: 'Enter your MediaFlow API password',
                        disabled: !mediaFlowEnabled,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <h3 style={{ padding: '5px' }}>Public IP (Optional)</h3>
                    <p style={{ padding: '5px' }}>
                      Configure this only when running MediaFlow locally with a
                      proxy service. Leave empty if MediaFlow is configured
                      locally without a proxy server or if it&apos;s hosted on a
                      remote server.
                    </p>
                  </div>
                  <div>
                    <CredentialInput
                      credential={mediaFlowPublicIp}
                      setCredential={setMediaFlowPublicIp}
                      inputProps={{
                        placeholder: 'Enter your MediaFlow public IP',
                        disabled: !mediaFlowEnabled,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.mediaFlowSection}>
                <div>
                  <div>
                    <h3 style={{ padding: '5px' }}>Proxy Addons (Optional)</h3>
                    <p style={{ padding: '5px' }}>
                      By default, all streams from every addon are proxied.
                      Choose specific addons here to proxy only their streams.
                    </p>
                  </div>
                  <div>
                    <MultiSelect
                      options={
                        addons.map((addon) => ({
                          value: `${addon.id}-${JSON.stringify(addon.options)}`,
                          label:
                            addon.options.addonName ||
                            addon.options.overrideName ||
                            addon.options.name ||
                            addon.id.charAt(0).toUpperCase() +
                              addon.id.slice(1),
                        })) || []
                      }
                      setValues={(selectedAddons) => {
                        setMediaFlowProxiedAddons(
                          selectedAddons.length === 0 ? null : selectedAddons
                        );
                      }}
                      values={mediaFlowProxiedAddons || undefined}
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <h3 style={{ padding: '5px' }}>
                      Proxy Services (Optional)
                    </h3>
                    <p style={{ padding: '5px' }}>
                      By default, all streams whether they are from a serivce or
                      not are proxied. Choose which services you want to proxy
                      through MediaFlow. Selecting None will also proxy streams
                      that are not (detected to be) from a service.
                    </p>
                  </div>
                  <div>
                    <MultiSelect
                      options={[
                        { value: 'none', label: 'None' },
                        ...serviceDetails.map((service) => ({
                          value: service.id,
                          label: service.name,
                        })),
                      ]}
                      setValues={(selectedServices) => {
                        setMediaFlowProxiedServices(
                          selectedServices.length === 0
                            ? null
                            : selectedServices
                        );
                      }}
                      values={mediaFlowProxiedServices || undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <div className={styles.installButtons}>
          <button
            onClick={handleInstall}
            className={styles.installButton}
            disabled={disableButtons}
          >
            Install
          </button>
          <button
            onClick={handleInstallToWeb}
            className={styles.installButton}
            disabled={disableButtons}
          >
            Install to Stremio Web
          </button>
          <button
            onClick={handleCopyLink}
            className={styles.installButton}
            disabled={disableButtons}
          >
            Copy Link
          </button>
          {manualManifestUrl && (
            <>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <p style={{ padding: '5px' }}>
                  If the above buttons do not work, you can use the following
                  manifest URL to install the addon.
                </p>
                <input
                  id="manualManifestUrl"
                  type="text"
                  value={manualManifestUrl}
                  readOnly
                  style={{ width: '100%', padding: '5px', margin: '5px' }}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <ToastContainer
        stacked
        position="top-center"
        transition={Slide}
        draggablePercent={30}
      />
    </div>
  );
}
