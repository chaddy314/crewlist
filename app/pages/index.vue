<script setup lang="ts">
import type {AccordionItem, TableColumn} from '@nuxt/ui';
import {vMaska} from 'maska/vue';
import {Member} from "~/model/member";
import {h, nextTick, resolveComponent} from 'vue';
import type {Row} from '@tanstack/vue-table';
import {Category} from "~/model/category";
import {Role} from "~/model/role";
import { jsPDF } from "jspdf";
import { autoTable } from 'jspdf-autotable';
import sailingLogo from '~/assets/sailing_logo.png';
import ColorModeButton from "~/util/ColorModeButton.vue";
import {useI18n} from "vue-i18n";

const i18n = useI18n();


const active = ref(['0','1', '2', '3']);
const toast = useToast();

const shipName = ref<string>('');
const shipNameInput = ref<HTMLInputElement | null>(null);
const callSign = ref<string>('');
const callSignInput = ref<HTMLInputElement | null>(null);
const MMSI = ref<string>('');
const MMSIInput = ref<HTMLInputElement | null>(null);
const beginDate = ref<string>('');
const beginDateInput = ref<HTMLInputElement | null>(null);
const endDate = ref<string>('');
const endDateInput = ref<HTMLInputElement | null>(null);

const crew = ref<Member[]>([]);
const firstNameRef = ref<string>('');
const firstNameInput = ref<HTMLInputElement | null>(null);
const lastNameRef = ref<string>('');
const lastNameInput = ref<HTMLInputElement | null>(null);

const newRoleRef = ref<string>('');
const categoryRef = ref<Category>();

const roles = ref<Role[]>();

const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const { locales, setLocale } = useI18n();

function initRoles () {

  roles.value = [];

  //  GENERAL
  roles.value.push(new Role(i18n.t("engineMalfunction"), Category.General));
  roles.value.push(new Role(i18n.t("emergencyTiller"), Category.General));
  roles.value.push(new Role(i18n.t("distressRadioCall"), Category.General));
  roles.value.push(new Role(i18n.t("seacock"), Category.General));
  roles.value.push(new Role(i18n.t("firstaidkit"), Category.General));

  //  WATER LEAKAGE
  roles.value.push(new Role(i18n.t("leakDetectionForeship"), Category.WaterLeak));
  roles.value.push(new Role(i18n.t("leakDetectionSaloon"), Category.WaterLeak));
  roles.value.push(new Role(i18n.t("leakDetectionAft"), Category.WaterLeak));
  roles.value.push(new Role(i18n.t("manualBilgePump"), Category.WaterLeak));
  roles.value.push(new Role(i18n.t("distressRadioCall"), Category.WaterLeak));
  roles.value.push(new Role(i18n.t("maritimeDistressSignal"), Category.WaterLeak));

  //  FIRE
  roles.value.push(new Role(i18n.t("fireExtinguisher"), Category.Fire));
  roles.value.push(new Role(i18n.t("fireBlanket"), Category.Fire));
  roles.value.push(new Role(i18n.t("closeGasValve"), Category.Fire));
  roles.value.push(new Role(i18n.t("closeFuelValve"), Category.Fire));
  roles.value.push(new Role(i18n.t("disconnectBattery"), Category.Fire));
  roles.value.push(new Role(i18n.t("firefighting"), Category.Fire));
  roles.value.push(new Role(i18n.t("distressRadioCall"), Category.Fire));
  roles.value.push(new Role(i18n.t("maritimeDistressSignal"), Category.Fire));

  //  PERSON OVERBOARD
  roles.value.push(new Role(i18n.t("lookout"), Category.PersonOverboard));
  roles.value.push(new Role(i18n.t("markPosition"), Category.PersonOverboard));
  roles.value.push(new Role(i18n.t("pressMOB"), Category.PersonOverboard));
  roles.value.push(new Role(i18n.t("throwLifebuoy"), Category.PersonOverboard));
  roles.value.push(new Role(i18n.t("startEngine"), Category.PersonOverboard));
  roles.value.push(new Role(i18n.t("conningManoeuvre"), Category.PersonOverboard));
  roles.value.push(new Role(i18n.t("distressRadioCall"), Category.PersonOverboard));
  roles.value.push(new Role(i18n.t("maritimeDistressSignal"), Category.PersonOverboard));
}

const items: AccordionItem[] = [
  {
    label: i18n.t("cruise_details"),
    icon: 'i-lucide-ship',
    slot: 'cruise' as const,
  },
  {
    label: i18n.t("crewMembers"),
    icon: 'i-lucide-users',
    slot: 'crew' as const,
  },
  {
    label: i18n.t("emergencyRoles"),
    icon: 'i-lucide-life-buoy',
    slot: 'roles' as const,
  },
  {
    label: 'Export',
    icon: 'i-lucide-save',
    slot: 'export' as const,
  }
];

const crewColumns: TableColumn<Member>[] = [
  {
    accessorKey: 'firstName',
    header: i18n.t("firstName"),
  },
  {
    accessorKey: 'lastName',
    header: i18n.t("lastName"),
  },
  {
    accessorKey: 'primaryRoles',
    header: i18n.t("primaryRoles"),
    cell: ({ row }: { row: Row<Member> }) => row.original.primaryRoles.length > 0 ? row.original.primaryList : i18n.t("noPrimary"),

  },
  {
    accessorKey: 'secondaryRoles',
    header: i18n.t("secondaryRoles"),
    cell: ({ row }: { row: Row<Member> }) => row.original.secondaryRoles.length > 0 ? row.original.secondaryList : i18n.t("noSecondary"),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
          'div',
          { class: 'text-right' },
          h(
              UDropdownMenu,
              {
                content: {
                  align: 'end'
                },
                items: getCrewRowItems(row),
                'aria-label': 'Actions dropdown'
              },
              () =>
                  h(UButton, {
                    icon: 'i-lucide-ellipsis-vertical',
                    color: 'neutral',
                    variant: 'ghost',
                    class: 'ml-auto',
                    'aria-label': 'Actions dropdown'
                  })
          )
      )
    }
  }
]

function addCrewToRole(crewMember: Member, role: Role, isPrimary: boolean) {
  if (isPrimary) {
    crewMember.primaryRoles.push(role);
    role.primaryMember = crewMember;
  } else {
    crewMember.secondaryRoles.push(role);
    role.secondaryMember = crewMember;
  }
}

const roleColumns: TableColumn<Role>[] = [
  {
    accessorKey: 'roleName',
    header: i18n.t("role"),
  },
  {
    accessorKey: 'primaryRoles',
    header: i18n.t("primaryRoles"),
    cell: ({ row }) => {
      return h(resolveComponent('USelect'), {
        modelValue: row.original.primaryMember?.id ?? null,
        multiple: false,
        class: 'w-full',
        placeholder: i18n.t("selectPrimary"),
        items: crew.value?.map(member => ({
          label: member.fullName,
          value: member.id // Use a unique id property
        })),
        'onUpdate:modelValue': (selectedId: string) => {
          const selectedMember = crew.value?.find(member => member.id === selectedId);
          if (selectedMember) {
            addCrewToRole(selectedMember, row.original, true);
            toast.add({
              title: i18n.t("primaryRoleAssigned"),
              description: `${selectedMember.fullName + i18n.t("assignedAsPrimary") + row.original.roleName}`,
              color: 'success',
            });
          } else {
            toast.add({
              title: 'Error',
              description: i18n.t("noCrewSelected"),
              color: 'error',
            });
          }
        }
      });
    }
  },
  {
    accessorKey: 'secondaryRoles',
    header: i18n.t("secondaryRoles"),
    cell: ({ row }) => {
      return h(resolveComponent('USelect'), {
        modelValue: row.original.secondaryMember?.id ?? null,
        multiple: false,
        class: 'w-full',
        placeholder: i18n.t("selectSecondary"),
        items: crew.value?.map(member => ({
          label: member.fullName,
          value: member.id // Use a unique id property
        })),
        'onUpdate:modelValue': (selectedId: string) => {
          const selectedMember = crew.value?.find(member => member.id === selectedId);
          if (selectedMember) {
            addCrewToRole(selectedMember, row.original, false);
            toast.add({
              title: i18n.t("secondaryRoleAssigned"),
              description: `${selectedMember.fullName + i18n.t("assignedAsSecondary") + row.original.roleName}`,
              color: 'success',
            });
          } else {
            toast.add({
              title: 'Error',
              description: i18n.t("noCrewSelected"),
              color: 'error',
            });
          }
        }
      });
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
          'div',
          { class: 'text-right' },
          h(
              UDropdownMenu,
              {
                content: {
                  align: 'end'
                },
                items: getRoleRowItems(row),
                'aria-label': 'Actions dropdown'
              },
              () =>
                  h(UButton, {
                    icon: 'i-lucide-ellipsis-vertical',
                    color: 'neutral',
                    variant: 'ghost',
                    class: 'ml-auto',
                    'aria-label': 'Actions dropdown'
                  })
          )
      )
    }
  }
]

function addCrew(firstName: string, lastName: string) {

  if (!crew.value) {
    crew.value = [];
  }

  if((firstNameRef.value + lastNameRef.value).trim() == '') {
    toast.add({
      title: i18n.t("crewMembers"),
      icon: 'i-lucide-zap',
      color: 'error',
      description: i18n.t("errorMemberName"),
    });
    return;
  }

  crew.value.push(new Member(firstName, lastName));
  toast.add({
    title: i18n.t("crewMembers"),
    description: i18n.t("successfullyAddedMember") + firstNameRef.value + ' ' + lastNameRef.value,
  });
  firstNameRef.value = '';
  lastNameRef.value = '';
}

function addRole(roleName: string, roleCategory: Category) {

  if (!roles.value) {
    roles.value = [];
  }

  if (roleCategory === undefined) {
    roleCategory = Category.General;
    console.log("Category was undefined, changed to General");
  }

  if(newRoleRef.value.trim() == '') {
    toast.add({
      title: i18n.t("role"),
      icon: 'i-lucide-zap',
      color: 'error',
      description: i18n.t("errorRoleName"),
    });
    return;
  }

  // Ensure roleCategory is a number (Category enum)
  if (typeof roleCategory === 'string') {
    roleCategory = (Category as any)[roleCategory] as Category;
  }

  roles.value.push(new Role(roleName, roleCategory));
  toast.add({
    title: i18n.t("crewMembers"),
    description: 'Succesfully added role ' + newRoleRef.value + ' to category ' + categoryRef.value,
  });
  newRoleRef.value = '';
}

function getCrewRowItems(row: Row<Member>) {
  return [
    {
      label: i18n.t("removeCrew"),
      icon: 'i-lucide-delete',
      onSelect() {
        const name = crew.value![row.index]!.firstName + ' ' + crew.value![row.index]!.lastName;
        crew.value?.splice(row.index, 1);
        toast.add({
          title: i18n.t("successfullyRemovedCrew"),
          color: 'success',
          icon: 'i-lucide-circle-check',
          description: name + i18n.t("crewRemoved")
        })
      }
    },
  ]
}

function getRoleRowItems(row: Row<Role>) {
  return [
    {
      label: i18n.t("removeRole"),
      icon: 'i-lucide-delete',
      onSelect() {
        const name = row.getValue('roleName');
        const rmIndex = roles.value?.findIndex(role => role.roleName === name);
        roles.value?.splice(rmIndex!, 1);
        toast.add({
          title: i18n.t("successfullyRemovedRole"),
          color: 'success',
          icon: 'i-lucide-circle-check',
          description: name + i18n.t("roleRemoved")
        })
      }
    },
  ]
}
const handleAccordionChange = () => {
  nextTick(() => {
    window.dispatchEvent(new Event('resize'));
  });
}


function exportAsPDF() {
  const doc = new jsPDF;
  let y = 20;
  const lineHeight = 10;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t("membersandroles"), 105, y, { align: 'center' } );
  y += lineHeight * 2;

  doc.setFontSize(16);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  autoTable(doc, {
    startY: y,
    head: [['','']],
    body: [
        [i18n.t("shipName"), shipName.value ? shipName.value : 'N/A'],
        [i18n.t("callSign"), callSign.value ? callSign.value : 'N/A'],
        ['MMSI', MMSI.value ? MMSI.value : 'N/A'],
        [i18n.t("cruiseBegin"), beginDate.value ? beginDate.value : 'N/A'],
        [i18n.t("cruiseEnd"), endDate.value ? endDate.value : 'N/A']
    ],
    columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' , fontStyle: 'bold', } },
    theme: 'plain',
    styles: { fontSize: 12, halign: 'center'},
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
    showHead: 'never',
  });


  y = doc.lastAutoTable.finalY +  lineHeight;
  doc.addImage(sailingLogo, "PNG", (doc.internal.pageSize.getWidth() - doc.canvas.width) / 2, y, doc.canvas.width, doc.canvas.width);

  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t("crewMembers"), 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  autoTable(doc, {
    startY: y,
    head: [[i18n.t("firstName"), i18n.t("lastName"), i18n.t("primaryRoles"), i18n.t("secondaryRoles")]],
    body: crew.value?.map(member => [
      member.firstName,
      member.lastName,
      member.primaryRoles.length > 0 ? member.primaryList : i18n.t("noPrimary") || 'N/A',
      member.secondaryRoles.length > 0 ? member.secondaryList : i18n.t("noSecondary") || 'N/A'
    ]) || [],
    theme: 'striped',
    styles: { fontSize: 12 },
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
  });


  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t("emergencyRoles")+ ' - ' + i18n.t("general"), 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [[i18n.t("role"), i18n.t("primaryMember"), i18n.t("secondaryMember")]],
    body: roles.value?.filter(role => role.category === Category.General).map(role => [
      role.roleName,
      role.primaryMember?.fullName || 'N/A',
      role.secondaryMember?.fullName || 'N/A'
    ]) || [],
    theme: 'striped',
    styles: { fontSize: 12 },
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
  });


  y = doc.lastAutoTable.finalY +  lineHeight;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t("emergencyRoles")+ ' - ' + i18n.t("waterLeak"), 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [[i18n.t("role"), i18n.t("primaryMember"), i18n.t("secondaryMember")]],
    body: roles.value?.filter(role => role.category === Category.WaterLeak).map(role => [
      role.roleName,
      role.primaryMember?.fullName || 'N/A',
      role.secondaryMember?.fullName || 'N/A'
    ]) || [],
    theme: 'striped',
    styles: { fontSize: 12 },
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
  });

  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t("emergencyRoles")+ ' - ' + i18n.t("fire"), 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [[i18n.t("role"), i18n.t("primaryMember"), i18n.t("secondaryMember")]],
    body: roles.value?.filter(role => role.category === Category.Fire).map(role => [
      role.roleName,
      role.primaryMember?.fullName || 'N/A',
      role.secondaryMember?.fullName || 'N/A'
    ]) || [],
    theme: 'striped',
    styles: { fontSize: 12 },
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
  });

  y = doc.lastAutoTable.finalY +  lineHeight;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t("emergencyRoles")+ ' - ' + i18n.t("personOverboard"), 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [[i18n.t("role"), i18n.t("primaryMember"), i18n.t("secondaryMember")]],
    body: roles.value?.filter(role => role.category === Category.PersonOverboard).map(role => [
      role.roleName,
      role.primaryMember?.fullName || 'N/A',
      role.secondaryMember?.fullName || 'N/A'
    ]) || [],
    theme: 'striped',
    styles: { fontSize: 12 },
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
  });

  doc.save('crew-and-emergency-roles' + (shipName.value ? ('-' + shipName.value.replaceAll(' ', '_')) : "") + '.pdf');

  toast.add({
    title: 'Export',
    description: 'Exported as crew-and-emergency-roles' + (shipName.value ? ('-' + shipName.value.replaceAll(' ', '_')) : "") + '.pdf',
    color: 'info',
  });
}

initRoles();
</script>

<template>
  <div class="">
    <div class="flex flex-col items-center justify-center gap-4 min-h-screen">
      <h1 class="font-bold text-2xl text-(--ui-primary)">
        {{ $t('membersandroles') }}
      </h1>
      <div class="flex flex-row items-center justify-center gap-2 mt-2">
        <ColorModeButton/>
        <UButton
            v-for="locale in locales"
            :key="locale.code"
            color="neutral"
            variant="ghost"
            :icon="locale.icon"
            @click="setLocale(locale.code)"
        >
          {{ locale.name }}
          </UButton>
      </div>
      <UContainer class="flex flex-col items-center justify-center gap-4 w-full">
        <UAccordion v-model="active" type="multiple" :unmount-on-hide="false" :items="items" @update:model-value="handleAccordionChange">
          <template #cruise="{ item }">
            <br/>
            <UInput ref="shipNameInput" v-model="shipName" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="callSignInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">{{ $t('shipName') }}</span>
              </label>
            </UInput><br/>
            <UInput ref="callSignInput" v-model="callSign" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="MMSIInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">{{ $t('callSign') }}</span>
              </label>
            </UInput><br/>
            <UInput ref="MMSIInput" v-model="MMSI" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="beginDateInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">MMSI</span>
              </label>
            </UInput><br/>
            <UInput ref="beginDateInput" v-model="beginDate" v-maska="'##.##.####'" placeholder="DD.MM.YYYY" :ui="{ base: 'peer' }" @keyup.enter="endDateInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">{{ $t('cruiseBegin') }}</span>
              </label>
            </UInput><br/>
            <UInput ref="endDateInput" v-model="endDate" v-maska="'##.##.####'" placeholder="DD.MM.YYYY" :ui="{ base: 'peer' }">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">{{ $t('cruiseEnd') }}</span>
              </label>
            </UInput>

            <p class="text-sm pb-3.5 text-primary"></p>
          </template>
          <template #crew="{ item }">
            <UInput ref="firstNameInput" v-model="firstNameRef" class="my-4" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="lastNameInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">{{ $t('firstName') }}</span>
              </label>
            </UInput>
            <UInput ref="lastNameInput" v-model="lastNameRef" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="addCrew(firstNameRef, lastNameRef); firstNameInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">{{ $t('lastName') }}</span>
              </label>
            </UInput>
            <UButton class="absolute rounded-full mx-1 my-4" icon="i-lucide-circle-plus" size="md" color="primary" variant="solid"  :ui="{ base: 'peer' }" @click="addCrew(firstNameRef, lastNameRef)"/>
            <UTable :data="crew" :columns="crewColumns" class="crew-table flex-1" />
          </template>
          <template #roles="{ item }">

            <USeparator class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }">{{ $t('newEmergencyRole') }}</USeparator>
            <UInput v-model="newRoleRef" class="my-4" placeholder="" :ui="{ base: 'peer' }">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">{{ $t('emergencyRole') }}</span>
              </label>
            </UInput>
            <USelect v-model="categoryRef" :items="Object.values(Category).filter(x => typeof x === 'string')" class="w-48" />
            <UButton class="absolute rounded-full mx-1 my-4" icon="i-lucide-circle-plus" size="md" color="primary" variant="solid"  :ui="{ base: 'peer' }" @click="addRole(newRoleRef, categoryRef)"/>

            <UTooltip text='0118, 999, 881, 999, 119, 7253'>
              <USeparator class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }">{{ $t('general') }}</USeparator>
            </UTooltip>
            <UTable :data="roles?.filter(x => x.category === Category.General)" :columns="roleColumns" class="flex-1" />

            <USeparator class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }">{{ $t('waterLeak') }}</USeparator>
            <UTable :data="roles?.filter(x => x.category === Category.WaterLeak)" :columns="roleColumns" class="flex-1" />

            <UTooltip text='Ooh! Fore! I mean "Five!" I mean "Fire!"'>
              <USeparator class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }">{{ $t('fire') }}</USeparator>
            </UTooltip>
            <UTable :data="roles?.filter(x => x.category === Category.Fire)" :columns="roleColumns" class="flex-1" />

            <USeparator class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }">{{ $t('personOverboard') }}</USeparator>
            <UTable :data="roles?.filter(x => x.category === Category.PersonOverboard)" :columns="roleColumns" class="flex-1" />

          </template>
          <template #export="{ item }">
            <UButton class="absolute rounded-full mx-1 my-4" icon="i-lucide-printer" size="md" color="primary" variant="solid"  :ui="{ base: 'peer' }" @click="exportAsPDF">
              {{ $t('saveAsPDF') }}
            </UButton>
          </template>
        </UAccordion>
      </UContainer>
    </div>
  </div>
</template>
<style>
/* Prevent the accordion from causing document shifts */
.accordion, [data-accordion] {
  contain: layout;
}

/* Ensure proper scroll behavior */
html {
  scroll-behavior: auto !important;
}

/* Reset any transforms that might cause offset */
body, html {
  transform: none !important;
}

.crew-table {
  table-layout: fixed;
  width: 100%;
}

.crew-table td,
.crew-table th {
  white-space: normal;
  word-break: normal;
}
</style>