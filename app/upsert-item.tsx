import { Stack, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useIntl } from 'react-intl';
import { useState, useEffect } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { ItemForm } from '~/components/forms/ItemForm';
import { router } from 'expo-router';


export default function UpsertItem() {
  const intl = useIntl();
  const { caseNumber } = useLocalSearchParams<{ caseNumber?: string }>();

  const [existingItem, setExistingItem] = useState<typeof itemTable.$inferSelect | null>(null);
  const [formState, setFormState] = useState<{ 
    canSubmit: boolean; 
    isSubmitting: boolean; 
    handleSubmit: () => void 
  }>({ 
    canSubmit: false, 
    isSubmitting: false, 
    handleSubmit: () => {} 
  });

  useEffect(() => {
    if (caseNumber) {
      db.select()
        .from(itemTable)
        .where(eq(itemTable.caseNumber, caseNumber))
        .then((result) => setExistingItem(result[0] || null));
    }
  }, [caseNumber]);

  const isEditing = Boolean(caseNumber && existingItem);


  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: isEditing ? 'edit-item.title' : 'add-item.title' }),
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="font-medium text-blue-500">
                {intl.formatMessage({ id: isEditing ? 'edit-item.back' : 'add-item.back' })}
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              disabled={!formState.canSubmit || formState.isSubmitting}
              style={{ opacity: formState.canSubmit && !formState.isSubmitting ? 1 : 0.5 }}
              onPress={formState.handleSubmit}>
              <Text className="font-medium text-blue-500">
                {intl.formatMessage({
                  id: isEditing ? 'edit-item.save-item' : 'add-item.save-item',
                })}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ItemForm
        caseNumber={caseNumber}
        existingItem={existingItem}
        isEditing={isEditing}
        onFormStateChange={setFormState}
      />
    </>
  );
}
