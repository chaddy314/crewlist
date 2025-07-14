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


function initRoles () {

  roles.value = [];

  //  GENERAL
  roles.value.push(new Role('Enginge Malfunction', Category.General));
  roles.value.push(new Role('Emergency Tiller', Category.General));
  roles.value.push(new Role('Distress Radio Call', Category.General));
//  roles.value.push(new Role('Distress Radio Call PAN PAN', Category.General));
//  roles.value.push(new Role('Distress Radio Call MAYDAY', Category.General));
  roles.value.push(new Role('Maritime Distress Signal', Category.General));
  roles.value.push(new Role('Seacock', Category.General));
  roles.value.push(new Role('First Aid Kit', Category.General));

  //  WATER LEAKAGE
  roles.value.push(new Role('Leak Detection Foreship/Toilet', Category.WaterLeak));
  roles.value.push(new Role('Leak Detection Saloon/Pantry', Category.WaterLeak));
  roles.value.push(new Role('Leak Detection Aft Section/Engine', Category.WaterLeak));
  roles.value.push(new Role('Electric Bilge Pump', Category.WaterLeak));
  roles.value.push(new Role('Manual Bilge Pump', Category.WaterLeak));
  roles.value.push(new Role('Distress Radio Call PAN PAN', Category.WaterLeak));
  roles.value.push(new Role('Maritime Distress Signal', Category.WaterLeak));

  //  FIRE
  roles.value.push(new Role('Fire Extinguisher', Category.Fire));
  roles.value.push(new Role('Fire Blanket', Category.Fire));
  roles.value.push(new Role('Close Gas Valve', Category.Fire));
  roles.value.push(new Role('Close Fuel Valve', Category.Fire));
  roles.value.push(new Role('Disconnect Battery', Category.Fire));
  roles.value.push(new Role('Firefighting/Bailer', Category.Fire));
  roles.value.push(new Role('Distress Radio Call PAN PAN', Category.Fire));
  roles.value.push(new Role('Maritime Distress Signal', Category.Fire));

  //  PERSON OVERBOARD
  roles.value.push(new Role('All Hands On Deck', Category.PersonOverboard));
  roles.value.push(new Role('Lookout', Category.PersonOverboard));
  roles.value.push(new Role('Hold Position', Category.PersonOverboard));
  roles.value.push(new Role('Hold MOB on GPS', Category.PersonOverboard));
  roles.value.push(new Role('Throw Lifebuoy', Category.PersonOverboard));
  roles.value.push(new Role('Start Engine', Category.PersonOverboard));
  roles.value.push(new Role('Conning Manoeuvre', Category.PersonOverboard));
  roles.value.push(new Role('Distress Radio Call MAYDAY', Category.PersonOverboard));
  roles.value.push(new Role('Distress Signal', Category.PersonOverboard));
}

function initTestCrew(): void {
  crew.value.push(new Member('Marc', 'Stahl'));
  crew.value.push(new Member('Vincent', 'Dünninger'));
  crew.value.push(new Member('Rosemarie', 'Stahl'));
  crew.value.push(new Member('Moritz', 'Pfister'));
  crew.value.push(new Member('Sonja', 'Neufeld'));
  crew.value.push(new Member('Manuela', 'Schmid'));
  crew.value.push(new Member('Yannik', 'Herbst'));
}

const items: AccordionItem[] = [
  {
    label: 'Cruise Details',
    icon: 'i-lucide-ship',
    slot: 'cruise' as const,
  },
  {
    label: 'Crew Members',
    icon: 'i-lucide-users',
    slot: 'crew' as const,
  },
  {
    label: 'Emergency Roles',
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
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'primaryRoles',
    header: 'Primary Roles',
    cell: ({ row }: { row: Row<Member> }) => row.original.primaryList,

  },
  {
    accessorKey: 'secondaryRoles',
    header: 'Secondary Roles',
    cell: ({ row }: { row: Row<Member> }) => row.original.secondaryList,
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
    header: 'Role',
  },
  {
    accessorKey: 'primaryRoles',
    header: 'Primary Roles',
    cell: ({ row }) => {
      return h(resolveComponent('USelect'), {
        modelValue: row.original.primaryMember?.id ?? null,
        multiple: false,
        class: 'w-full',
        placeholder: 'Select primary crew',
        items: crew.value?.map(member => ({
          label: member.fullName,
          value: member.id // Use a unique id property
        })),
        'onUpdate:modelValue': (selectedId: string) => {
          const selectedMember = crew.value?.find(member => member.id === selectedId);
          if (selectedMember) {
            addCrewToRole(selectedMember, row.original, true);
            toast.add({
              title: 'Primary Role Assigned',
              description: `${selectedMember.fullName} assigned as primary for ${row.original.roleName}`,
              color: 'success',
            });
          } else {
            toast.add({
              title: 'Error',
              description: 'No crew member selected.',
              color: 'error',
            });
          }
        }
      });
    }
  },
  {
    accessorKey: 'secondaryRoles',
    header: 'Secondary Roles',
    cell: ({ row }) => {
      return h(resolveComponent('USelect'), {
        modelValue: row.original.secondaryMember?.id ?? null,
        multiple: false,
        class: 'w-full',
        placeholder: 'Select secondary crew',
        items: crew.value?.map(member => ({
          label: member.fullName,
          value: member.id // Use a unique id property
        })),
        'onUpdate:modelValue': (selectedId: string) => {
          const selectedMember = crew.value?.find(member => member.id === selectedId);
          if (selectedMember) {
            addCrewToRole(selectedMember, row.original, false);
            toast.add({
              title: 'Secondary Role Assigned',
              description: `${selectedMember.fullName} assigned as secondary for ${row.original.roleName}`,
              color: 'success',
            });
          } else {
            toast.add({
              title: 'Error',
              description: 'No crew member selected.',
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
      title: 'Crew Members',
      icon: 'i-lucide-zap',
      color: 'error',
      description: 'Please add a name for the crew member.',
    });
    return;
  }

  crew.value.push(new Member(firstName, lastName));
  toast.add({
    title: 'Crew Members',
    description: 'Succesfully added Crew Member ' + firstNameRef.value + ' ' + lastNameRef.value,
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
      title: 'Role',
      icon: 'i-lucide-zap',
      color: 'error',
      description: 'Roles should have a name',
    });
    return;
  }
  roles.value.push(new Role(roleName, roleCategory));
  toast.add({
    title: 'Crew Members',
    description: 'Succesfully added role ' + newRoleRef.value + ' to category ' + categoryRef.value,
  });
  newRoleRef.value = '';
}

function getCrewRowItems(row: Row<Member>) {
  return [
    {
      label: 'Remove from Crew',
      icon: 'i-lucide-delete',
      onSelect() {
        const name = crew.value![row.index]!.firstName + ' ' + crew.value![row.index]!.lastName;
        crew.value?.splice(row.index, 1);
        toast.add({
          title: 'Crew Member Removed!',
          color: 'success',
          icon: 'i-lucide-circle-check',
          description: name + ' removed from Crew'
        })
      }
    },
  ]
}

function getRoleRowItems(row: Row<Role>) {
  return [
    {
      label: 'Remove from Roles',
      icon: 'i-lucide-delete',
      onSelect() {
        const name = row.getValue('roleName');
        const rmIndex = roles.value?.findIndex(role => role.roleName === name);
        roles.value?.splice(rmIndex!, 1);
        toast.add({
          title: 'Role Removed!',
          color: 'success',
          icon: 'i-lucide-circle-check',
          description: name + ' removed from Roles'
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
  doc.text('Crew Members & Emergency Roles', 105, y, { align: 'center' } );
  y += lineHeight * 2;

  doc.setFontSize(16);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  autoTable(doc, {
    startY: y,
    head: [['','']],
    body: [
        ['Ship Name', shipName.value ? shipName.value : 'N/A'],
        ['Call Sign', callSign.value ? callSign.value : 'N/A'],
        ['MMSI', MMSI.value ? MMSI.value : 'N/A'],
        ['Cruise Begin Date', beginDate.value ? beginDate.value : 'N/A'],
        ['Cruise End Date', endDate.value ? endDate.value : 'N/A']
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
  doc.text('Crew Members', 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  autoTable(doc, {
    startY: y,
    head: [['First Name', 'Last Name', 'Primary Roles', 'Secondary Roles']],
    body: crew.value?.map(member => [
      member.firstName,
      member.lastName,
      member.primaryList || 'N/A',
      member.secondaryList || 'N/A'
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
  doc.text('Emergency Roles - General', 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [['Role Name', 'Primary Member', 'Secondary Member']],
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
  doc.text('Emergency Roles - Water Leakage', 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [['Role Name', 'Primary Member', 'Secondary Member']],
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
  doc.text('Emergency Roles - Fire', 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [['Role Name', 'Primary Member', 'Secondary Member']],
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
  doc.text('Emergency Roles - Person Overboard', 10, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    startY: y,
    head: [['Role Name', 'Primary Member', 'Secondary Member']],
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



//initTestCrew();
initRoles();
</script>

<template>
  <div class="">
    <div class="flex flex-col items-center justify-center gap-4 min-h-screen">
      <h1 class="font-bold text-2xl text-(--ui-primary)">
        Crew Members & Emergency Roles
      </h1>
      <ColorModeButton/>
      <UContainer class="flex flex-col items-center justify-center gap-4 w-full">
        <UAccordion v-model="active" type="multiple" :unmount-on-hide="false" :items="items" @update:model-value="handleAccordionChange">
          <template #cruise="{ item }">
            <br/>
            <UInput ref="shipNameInput" v-model="shipName" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="callSignInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">Ship Name</span>
              </label>
            </UInput><br/>
            <UInput ref="callSignInput" v-model="callSign" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="MMSIInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">Call Sign</span>
              </label>
            </UInput><br/>
            <UInput ref="MMSIInput" v-model="MMSI" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="beginDateInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">MMSI</span>
              </label>
            </UInput><br/>
            <UInput ref="beginDateInput" v-model="beginDate" v-maska="'##.##.####'" placeholder="DD.MM.YYYY" :ui="{ base: 'peer' }" @keyup.enter="endDateInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">Cruise Begin Date</span>
              </label>
            </UInput><br/>
            <UInput ref="endDateInput" v-model="endDate" v-maska="'##.##.####'" placeholder="DD.MM.YYYY" :ui="{ base: 'peer' }">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">Cruise End Date</span>
              </label>
            </UInput>

            <p class="text-sm pb-3.5 text-primary"></p>
          </template>
          <template #crew="{ item }">
            <UInput ref="firstNameInput" v-model="firstNameRef" class="my-4" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="lastNameInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">First Name</span>
              </label>
            </UInput>
            <UInput ref="lastNameInput" v-model="lastNameRef" placeholder="" :ui="{ base: 'peer' }" @keyup.enter="addCrew(firstNameRef, lastNameRef); firstNameInput!.$el.querySelector('input')?.focus()">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">Last Name</span>
              </label>
            </UInput>
            <UButton class="absolute rounded-full mx-1 my-4" icon="i-lucide-circle-plus" size="md" color="primary" variant="solid"  :ui="{ base: 'peer' }" @click="addCrew(firstNameRef, lastNameRef)"/>
            <UTable :data="crew" :columns="crewColumns" class="crew-table flex-1" />
          </template>
          <template #roles="{ item }">

            <USeparator label="Add New Emergency Role" class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }"/>
            <UInput v-model="newRoleRef" class="my-4" placeholder="" :ui="{ base: 'peer' }">
              <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                <span class="inline-flex bg-default px-1">Emergency Role</span>
              </label>
            </UInput>
            <USelect v-model="categoryRef" :items="Object.values(Category).filter(x => typeof x === 'string')" class="w-48" />
            <UButton class="absolute rounded-full mx-1 my-4" icon="i-lucide-circle-plus" size="md" color="primary" variant="solid"  :ui="{ base: 'peer' }" @click="addRole(newRoleRef, categoryRef)"/>

            <UTooltip text='0118, 999, 881, 999, 119, 7253'>
              <USeparator label="General" class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }"/>
            </UTooltip>
            <UTable :data="roles?.filter(x => x.category === Category.General)" :columns="roleColumns" class="flex-1" />

            <USeparator label="Water Leakage" class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }"/>
            <UTable :data="roles?.filter(x => x.category === Category.WaterLeak)" :columns="roleColumns" class="flex-1" />

            <UTooltip text='Ooh! Fore! I mean "Five!" I mean "Fire!"'>
              <USeparator label="Fire" class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }"/>
            </UTooltip>
            <UTable :data="roles?.filter(x => x.category === Category.Fire)" :columns="roleColumns" class="flex-1" />

            <USeparator label="Person Overboard" class="my-5" size="xl" :ui="{ label: 'text-lg font-medium' }"/>
            <UTable :data="roles?.filter(x => x.category === Category.PersonOverboard)" :columns="roleColumns" class="flex-1" />

          </template>
          <template #export="{ item }">
            <UButton label="Save as PDF" class="absolute rounded-full mx-1 my-4" icon="i-lucide-printer" size="md" color="primary" variant="solid"  :ui="{ base: 'peer' }" @click="exportAsPDF"/>
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